"use client";
import React, {
  FormEvent,
  useEffect,
  useState,
  useRef,
  ChangeEvent,
} from "react";
import {
  Send,
  MoreVertical,
  Search,
  ArrowLeft,
  Users,
  Phone,
  Video,
} from "lucide-react";
import { use } from "react";

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

export default function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        // --- FIX 1: Using env variable and correct route ---
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_URL}/me`, {
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
        // --- FIX 2: Using env variable and correct route ---
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_HTTP_URL}/rooms/${slug}/messages`,
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      setConnectionStatus("disconnected");
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let isIntentionalClose = false;

    const connect = () => {
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        setConnectionStatus("disconnected");
        return;
      }

      try {
        setConnectionStatus("connecting");
        // --- FIX 3: Using WebSocket env variable ---
        // We assume NEXT_PUBLIC_WS_URL is set to wss://ws-backend-f903.onrender.com
        ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`);

        ws.onopen = () => {
          console.log("✅ Connected to WebSocket server");
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0;
          setSocket(ws);

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "join-room", slug: slug }));
          }
        };

        ws.onmessage = (event) => {
          try {
            if (typeof event.data !== "string") {
              console.log("Received non-string message:", event.data);
              return;
            }

            let data;
            try {
              data = JSON.parse(event.data);
            } catch (parseError) {
              console.log("Received plain text message:", event.data);
              return;
            }

            if (data.type === "new message" && data.chat) {
              const newMessage: UnifiedMessage = {
                id: data.chat.id,
                text: data.chat.message,
                userName: data.chat.user.name,
                createdAt: data.chat.createdAt,
              };

              setMessages((prevMessages) => {
                const exists = prevMessages.some(
                  (msg) => msg.id === newMessage.id
                );
                if (exists) {
                  return prevMessages;
                }
                return [...prevMessages, newMessage];
              });
            } else if (data.type === "typing") {
              setIsTyping(true);
              setTimeout(() => setIsTyping(false), 3000);
            } else {
              console.log("Received message:", data);
            }
          } catch (err) {
            console.error("Error handling message:", err);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          setSocket(null);
          setConnectionStatus("disconnected");

          if (
            !isIntentionalClose &&
            reconnectAttemptsRef.current < maxReconnectAttempts
          ) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttemptsRef.current),
              10000
            ); // Exponential backoff
            console.log(
              `Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            reconnectTimeout = setTimeout(connect, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("disconnected");
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setConnectionStatus("disconnected");

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          );
          reconnectTimeout = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      isIntentionalClose = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [slug]);

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
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-5xl h-full md:h-[95vh] flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 md:rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 px-4 py-4 flex items-center gap-3 shadow-lg">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

          <button className="md:hidden relative z-10 hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white/30">
            <span className="text-white font-bold text-lg">
              {slug.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 relative z-10">
            <h2 className="text-white font-semibold text-lg">{slug}</h2>
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-purple-100">Online</p>
                  {isTyping && (
                    <p className="text-xs text-purple-200 italic">
                      • typing...
                    </p>
                  )}
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-purple-200">Connecting...</p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <p className="text-xs text-purple-200">Disconnected</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Video className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            `,
            backgroundColor: "#0f172a",
          }}
        >
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage(msg.userName) ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom`}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div
                  className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transform transition-all hover:scale-[1.02] ${
                    isOwnMessage(msg.userName)
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 rounded-br-md"
                      : "bg-slate-700/80 rounded-bl-md border border-slate-600/50"
                  }`}
                >
                  {!isOwnMessage(msg.userName) && (
                    <p className="text-xs font-semibold text-pink-400 mb-1.5">
                      {msg.userName}
                    </p>
                  )}
                  <p className="text-white text-[15px] break-words leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-300/70 font-medium">
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
                        className="inline-block"
                      >
                        <path
                          d="M11.071.653a.694.694 0 0 0-.978 0L5.5 5.206 2.907 2.613a.694.694 0 0 0-.978 0 .694.694 0 0 0 0 .978l3.083 3.083a.694.694 0 0 0 .978 0l5.081-5.082a.694.694 0 0 0 0-.978zM15.5 5.206l-5.592 5.553a.694.694 0 0 1-.978 0l-.488-.488a.694.694 0 0 1 0-.978l5.08-5.082a.694.694 0 0 1 .978 0 .694.694 0 0 1 0 .978z"
                          fill="rgba(255,255,255,0.7)"
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

        {/* Enhanced Input Area */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 border-t border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                className="w-full bg-slate-700/50 text-white px-5 py-3.5 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-slate-600/50 text-sm backdrop-blur-sm transition-all"
                type="text"
                placeholder="Type a message..."
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
            </div>

            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600 p-3.5 rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:shadow-none"
              disabled={!socket || !currentMessage.trim()}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          {!socket && connectionStatus === "disconnected" && (
            <p className="text-xs text-red-400 mt-2 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              Connection lost. Refresh the page or check your server.
            </p>
          )}
          {connectionStatus === "connecting" && (
            <p className="text-xs text-yellow-400 mt-2 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Connecting to server...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
