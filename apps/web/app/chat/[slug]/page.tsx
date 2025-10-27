"use client";
import React, {
  FormEvent,
  useEffect,
  useState,
  useRef,
  ChangeEvent,
} from "react";
import { Send, MoreVertical, Search, ArrowLeft } from "lucide-react";

// 1. Define your data structures
interface UnifiedMessage {
  id: number;
  text: string;
  userName: string;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  name: string;
}

interface HistoryMessage {
  id: number;
  message: string;
  createdAt: string;
  user: { name: string };
}

export default function ChatPage({ params }: { params: { slug: string } }) {

  const [slug, setSlug] = useState<string>(params.slug);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);


  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5001/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    }
    fetchMe();
  }, []);


  useEffect(() => {
    async function fetchhistoricalmessages() {
      const token = localStorage.getItem("token");

      if (!slug || !token) return;
      try {
        const response = await fetch(
          `http://localhost:5001/api/rooms/${slug}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch messages.");

        const historicalData: HistoryMessage[] = await response.json();

        const formattedMessages = historicalData.map((msg) => ({
          id: msg.id,
          text: msg.message,
          userName: msg.user.name,
          createdAt: msg.createdAt,
        }));

        setMessages(formattedMessages.reverse());
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    }
    fetchhistoricalmessages();

  }, [slug]);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join-room", slug: slug }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new message" && data.chat) {
        const newMessage: UnifiedMessage = {
          id: data.chat.id,
          text: data.chat.message,
          userName: data.chat.user.name,
          createdAt: data.chat.createdAt,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }


    };

    ws.onclose = () => setSocket(null);
    ws.onerror = (error) => console.error("WebSocket error:", error);

    return () => ws.close();
  }, [slug]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !socket) return;

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: slug,
        message: currentMessage,
      })
    );
    setCurrentMessage("");
  };

  const isOwnMessage = (userName: string) => {
    return userName === currentUser?.name;
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-4xl h-full md:h-[95vh] flex flex-col bg-[#0b141a] md:rounded-lg overflow-hidden shadow-2xl">
        {/* WhatsApp Header */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
          <button className="md:hidden">
            <ArrowLeft className="w-6 h-6 text-[#aebac1]" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {/* Use the 'slug' state variable */}
              {slug.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            {/* Use the 'slug' state variable */}
            <h2 className="text-white font-medium">{slug}</h2>
            <p className="text-xs text-[#8696a0]">
              {socket ? "online" : "connecting..."}
              {/* ... (add your "is typing" UI here) */}
            </p>
          </div>
          <Search className="w-5 h-5 text-[#6a7982] cursor-pointer" />
          <MoreVertical className="w-5 h-5 text-[#aebac1] cursor-pointer" />
        </div>

        {/* Chat Background with Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: "#0b1a1a",
          }}
        >
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage(msg.userName) ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 shadow-md ${isOwnMessage(msg.userName) ? "bg-[#005c4b]" : "bg-[#202c33]"
                    }`}
                >
                  {!isOwnMessage(msg.userName) && (
                    <p className="text-xs font-semibold text-[#00a884] mb-1">
                      {msg.userName}
                    </p>
                  )}
                  <p className="text-white text-sm break-words leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-[#8696a0]">
                      {/* Use the message's real timestamp */}
                      {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    {isOwnMessage(msg.userName) && (
                      <svg
                        width="16"
                        height="11"
                        viewBox="0 0 16 11"
                        className="inline-block ml-1"
                      >
                        <path
                          d="M11.071.653a.694.694 0 0 0-.978 0L5.5 5.206 2.907 2.613a.694.694 0 0 0-.978 0 .694.694 0 0 0 0 .978l3.083 3.083a.694.694 0 0 0 .978 0l5.081-5.082a.694.694 0 0 0 0-.978zM15.5 5.206l-5.592 5.553a.694.694 0 0 1-.978 0l-.488-.488a.694.694 0 0 1 0-.978l5.08-5.082a.694.694 0 0 1 .978 0 .694.694 0 0 1 0 .978z"
                          fill="#8696a0"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* WhatsApp Input */}
        <div className="bg-[#202c33] px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-[#2a3942] text-white px-4 py-3 rounded-lg placeholder-[#8696a0] focus-outline-none text-sm"
              type="text"
              placeholder="Type a message"
              value={currentMessage}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCurrentMessage(e.target.value);
                socket?.send(JSON.stringify({ type: "typing", slug: slug }));
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={!socket}
            />

            <button
              onClick={handleSubmit}
              className="bg-[#00a884] p-3 rounded-full hover:bg-[#06cf9c] disabled:bg-[#3b4a54] disabled:cursor-not-allowed transition-colors"
              disabled={!socket || !currentMessage.trim()}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
