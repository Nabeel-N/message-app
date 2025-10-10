"use client"
import React, { useEffect, useState } from 'react';
import { Send, LogOut, Plus, X } from 'lucide-react';

interface Room {
  id: string;
  slug: string;
}

interface Message {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    photo?: string;
  };
}

export default function ChatApp() {
  const [token, setToken] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [newRoomSlug, setNewRoomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // Initialize and check token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/signin';
      return;
    }
    setToken(storedToken);
    fetchRooms(storedToken);
  }, []);

  // Fetch rooms from API
  const fetchRooms = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/me/rooms', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.room || []);
      } else {
        setError('Failed to fetch rooms');
      }
    } catch (err) {
      setError('Could not connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setWs(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new message' && currentRoom) {
          if (data.chat.room.slug === currentRoom.slug) {
            setMessages((prev) => [data.chat, ...prev]);
          }
        } else if (data.type === 'joined-existing-room' || data.type === 'room-created') {
          console.log('Room action:', data);
        } else if (typeof data === 'string') {
          console.log('Server message:', data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setWs(null);
    };

    return () => {
      ws.close();
    };
  }, [token, currentRoom]);

  // Fetch messages when room changes
  useEffect(() => {
    if (currentRoom && token) {
      fetchMessages(currentRoom.slug);
    }
  }, [currentRoom, token]);

  const fetchMessages = async (slug: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/rooms/${slug}/messages`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      } else {
        setError('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Handle creating or joining a room
  const handleCreateRoom = () => {
    if (!ws || !newRoomSlug.trim()) return;

    ws.send(
      JSON.stringify({
        type: 'join-room',
        slug: newRoomSlug.trim(),
      })
    );

    setNewRoomSlug('');
    setShowCreateRoom(false);
    setTimeout(() => fetchRooms(token!), 1000);
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!ws || !inputValue.trim() || !currentRoom) return;

    ws.send(
      JSON.stringify({
        type: 'chat',
        roomId: currentRoom.slug,
        message: inputValue.trim(),
      })
    );

    setInputValue('');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/signin';
  };

  if (!token || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Chat</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setCurrentRoom(room)}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition ${currentRoom?.id === room.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                >
                  # {room.slug}
                </button>
              ))
            ) : (
              <p className="text-gray-400 px-4 py-2">No rooms yet</p>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-700 space-y-2">
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} /> New Room
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          {currentRoom ? (
            <h2 className="text-xl font-bold">#{currentRoom.slug}</h2>
          ) : (
            <p className="text-gray-400">Select a room to start chatting</p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="text-red-500 text-center py-4">{error}</div>}
          {currentRoom ? (
            messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    {msg.user.photo ? (
                      <img
                        src={msg.user.photo}
                        alt={msg.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="font-bold">{msg.user.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{msg.user.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-100 mt-1">{msg.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</p>
            )
          ) : (
            <p className="text-gray-400 text-center py-8">Select a room to view messages</p>
          )}
        </div>

        {/* Input Area */}
        {currentRoom ? (
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-4 border-t border-gray-700 text-center text-gray-400">
            Select a room to start messaging
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              value={newRoomSlug}
              onChange={(e) => setNewRoomSlug(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              placeholder="Room name..."
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomSlug.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
