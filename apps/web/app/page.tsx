"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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

        const response = await fetch("http://localhost:5001/api/me/rooms", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

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

      const apiEndpoint = "http://localhost:5001/api/create-room";

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-r from-green-800 to-orange-700">
      <div className=" rounded-xl bg-gradient-to-r from-blue-500 via-green-400 to-purple-700">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 flex items-center justify-center ">Your Chat Rooms</h1>

          <form onSubmit={handleCreateRoom} className="mb-8 flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Enter new room slug"
              className="flex-grow p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button type="submit" className="bg-violet-600 hover:bg-violet-700 font-bold py-2 px-4 rounded-lg transition-colors">
              Create Room
            </button>
          </form>

          {error && (
            <div className="text-red-500 p-3 mb-4 bg-red-900/50 rounded-lg text-center">
              <p>Error: {error}</p>
            </div>
          )}

          <ul>
            {data && data.length > 0 ? (
              data.map((room) => (
                <li
                  key={room.id}
                  className="bg-gray-700 p-4 mb-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/chat/${encodeURIComponent(room.slug)}`);
                  }}
                >
                  <p className="text-lg font-semibold text-gray-200">/{room.slug}</p>
                </li>
              ))
            ) : (
              <p>You haven't joined any rooms yet.</p>
            )}
          </ul>
        </div>
      </div >
    </div>
  );
}
