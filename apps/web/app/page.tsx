"use client";
import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageCircle, Users, Sparkles } from "lucide-react";
interface Room {
  id: number;
  slug: string;
}

export default function Home() {
  const [data, setData] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [slug, setSlug] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User is not authenticated");
          setLoading(false);
          return;
        }

        // --- FIX 1: Using env variable and correct route ---
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_HTTP_URL}/me/rooms`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch rooms.");
        }

        const responseData = await response.json();
        setData(responseData.room);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  async function handleCreateRoom(event: FormEvent) {
    event.preventDefault();

    if (!slug) {
      setError("Slug cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }

      const apiEndpoint = `${process.env.NEXT_PUBLIC_HTTP_URL}/create-room`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: slug }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create room.");
      }

      const newRoomData = await response.json();
      const newRoom = newRoomData.message;
      setData((prevRooms) => [newRoom, ...prevRooms]);
      setSlug("");
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400 opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading your rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300 hover:shadow-purple-200/50">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-12 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Chat Rooms</h1>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-purple-100 text-lg">
                Create or join a room to start chatting with others
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Create room section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                Create New Room
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateRoom(e);
                    }
                  }}
                  placeholder="Enter room name"
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white/50 backdrop-blur-sm placeholder-gray-400"
                />
                <button
                  onClick={handleCreateRoom}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Create
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            {/* Rooms list */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                Your Rooms
                <span className="ml-auto text-sm font-semibold px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full">
                  {data.length}
                </span>
              </h2>

              {data && data.length > 0 ? (
                <div className="space-y-3">
                  {data.map((room, index) => (
                    <div
                      key={room.id}
                      onClick={() =>
                        router.push(`/chat/${encodeURIComponent(room.slug)}`)
                      }
                      className="group relative flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-lg bg-white/50 backdrop-blur-sm"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="text-white font-bold text-lg">
                            {room.slug.charAt(0).toUpperCase()}
                          </span>
                          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                            {room.slug}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Click to join
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <svg
                            className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="relative inline-block mb-6">
                    <MessageCircle className="w-20 h-20 text-gray-300 mx-auto" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg mb-2">
                    No rooms yet
                  </p>
                  <p className="text-gray-400">
                    Create your first room above to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Built with ❤️ for seamless communication
        </p>
      </div>
    </div>
  );
}
