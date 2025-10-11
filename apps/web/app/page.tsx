
"use client";
import { useEffect, useState } from "react";

interface Room {
  id: number;
  name: string;
  slug: string;
}

export default function Home() {
  const [data, SetData] = useState<Room[]>([]);
  const [error, SetError] = useState<string | null>(null);
  const [loading, Setloading] = useState<boolean>(true);

  const api = "http://localhost:5001/api/me/rooms";

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          SetError("User is not authenticated");
          Setloading(false);
          return;
        }
        await fetchData(token, api, "Get");
      } catch (e) {
        SetError("An unexpected error occurred.");
        Setloading(false);
      }
    })();
  }, []);

  async function fetchData(token: string, apiendpoint: string, req: string) {
    try {
      if (!token) {
        SetError("User is not verified");
        throw new Error("Token is not present");
      }
      const response = await fetch(apiendpoint, {
        method: req,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || "An unknown error occurred");
      }

      const responseData = await response.json();
      SetData(responseData.room);

    } catch (e: any) {
      console.error("Error from fetchData:", e);
      SetError(e.message || "Failed to fetch data.");
    } finally {
      Setloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-red-500 p-4 bg-red-900/50 rounded-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-800 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Your Chat Rooms</h1>
      <ul>
        {data && data.length > 0 ? (
          data.map((room) => (
            <li
              key={room.id}
              className="bg-gray-700 p-4 mb-3 rounded-lg hover:bg-violet-800 transition-colors cursor-pointer"
            >
              <p className="font-semibold text-lg">{room.name}</p>
              <p className="text-sm text-gray-400">/{room.slug}</p>
            </li>
          ))
        ) : (
          <p>You haven&t joined any rooms yet.</p>
        )}
      </ul>
    </div>
  );
}

