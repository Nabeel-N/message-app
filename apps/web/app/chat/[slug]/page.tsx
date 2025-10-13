"use client"
import { FormEvent, useEffect, useState } from "react";

interface MessagePayload {
  type: string;
  slug?: string;
  message?: string;
  roomId?: string;
  chat?: {
    id: number;
    message: string;
  }
}

export default function Chat() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [roomSlug, setRoomSlug] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Authentication token not found.");
      return;
    }

    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];
    if (!slug) {
      console.error("Room slug not found in URL.");
      return;
    }
    setRoomSlug(slug);

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setSocket(ws);

      ws.send(JSON.stringify({
        type: "join-room",
        slug: slug
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      console.log("Closing WebSocket connection.");
      ws.close();
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !socket) {
      return;
    }

    const messagePayload = {
      type: "chat",
      roomId: roomSlug,
      message: currentMessage
    };

    socket.send(JSON.stringify(messagePayload));
    setCurrentMessage("");
  };

  return (
    <div className="h-screen w-screen bg-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl h-full flex flex-col bg-gray-900 rounded-lg shadow-xl">
        {/* Message Display Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {messages.map((msg, index) => {
              let content = '';
              let isNotification = false;

              if (msg.type === 'new message' && msg.chat) {
                content = msg.chat.message;
              } else if (msg.type === 'joined-existing-room' || msg.type === 'room-created') {
                content = `Notification: You have joined room "${msg.slug}"`;
                isNotification = true;
              } else {
                content = JSON.stringify(msg);
              }

              return (
                <li
                  key={index}
                  className={`p-2 rounded-lg text-white w-fit ${isNotification
                    ? 'bg-gray-700 text-center text-xs mx-auto'
                    : 'bg-blue-600'
                    }`}
                >
                  {content}
                </li>
              );
            })}
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
