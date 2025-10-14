"use client"
import { FormEvent, useEffect, useState, useRef } from "react";

interface UnifiedMessage {
  id: number;
  text: string;
  userName: string;
}

export default function ChatPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistoricalMessages = async () => {
      const token = localStorage.getItem("token");
      if (!slug || !token) return;

      try {
        const response = await fetch(`http://localhost:5001/api/rooms/${slug}/messages`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch messages.");

        const historicalData: { id: number; message: string; user: { name: string } }[] = await response.json();

        const formattedMessages = historicalData.map(msg => ({
          id: msg.id,
          text: msg.message,
          userName: msg.user.name,
        }));

        setMessages(formattedMessages.reverse());
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    fetchHistoricalMessages();
  }, [slug]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join-room", slug: slug }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'new message' && data.chat) {
        const newMessage: UnifiedMessage = {
          id: data.chat.id,
          text: data.chat.message,
          userName: data.chat.user.name,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    ws.onclose = () => setSocket(null);
    ws.onerror = (error) => console.error('WebSocket error:', error);

    return () => ws.close();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !socket) return;

    socket.send(JSON.stringify({
      type: "chat",
      roomId: slug,
      message: currentMessage
    }));
    setCurrentMessage("");
  };

  return (
    <div className="h-screen w-screen bg-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl h-full flex flex-col bg-gray-900 rounded-lg shadow-xl">
        <div className="p-4 bg-gray-700 text-white text-center font-bold">
          <h2>Room: /{slug}</h2>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-4">
            {messages.map((msg) => (
              <li key={msg.id} className="flex flex-col">
                <span className="text-sm text-gray-400">{msg.userName}</span>
                <div className="p-3 rounded-lg text-white bg-blue-600 w-fit max-w-xs break-words">
                  {msg.text}
                </div>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>
        </div>

        <div className="p-4 bg-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 p-2 text-black bg-white rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              disabled={!socket}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500"
              disabled={!socket}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
