
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function ChatInterface() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar for Room List */}
      <aside className="w-full md:w-1/4 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Chat Rooms</h2>
        <ul className="space-y-2 overflow-y-auto">
          {/* Example Room Items - We will fetch these later */}
          <li className="p-2 rounded-lg bg-blue-600 cursor-pointer">
            # general
          </li>
          <li className="p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
            # random
          </li>
          <li className="p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
            # help-desk
          </li>
        </ul>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex-col hidden md:flex">
        {/* Header */}
        <header className="bg-gray-800 p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold"># general</h1>
        </header>

        {/* Message Display Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Example Messages - We will fetch these later */}
          <div className="mb-4">
            <p className="font-bold">Nabeel</p>
            <p className="bg-gray-700 p-2 rounded-lg inline-block">Hello everyone!</p>
          </div>
          <div className="mb-4 text-right">
            <p className="font-bold">You</p>
            <p className="bg-blue-600 p-2 rounded-lg inline-block">Hi Nabeel, welcome!</p>
          </div>
        </div>

        {/* Message Input Form */}
        <footer className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="flex">
            <input
              type="text"
              placeholder="Type your message here..."
              className="flex-1 p-2 rounded-l-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 px-4 rounded-r-lg hover:bg-blue-700">
              Send
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}


export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token is found, redirect to the sign-in page
      router.push('/signin');
    } else {
      // If a token is found, allow the component to render
      setIsAuthenticated(true);
    }
  }, [router]);

  // Render a loading state or null while checking for authentication
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated, show the main chat interface
  return <ChatInterface />;
}

