"use client";
import { useRouter } from "next/navigation";

export default function Roompage() {
  const router = useRouter();

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-10">

      <div className="flex items-center justify-center ">
        <div className="bg-green-600 border-8 px-40 py-40 rounded-full overflow-hidden ">
          <h1 className="text-6xl font-bold bg-gradient-to-t from-indigo-500 via-violet-300 to-rose-500 rounded-full p-4">
            Chat with your friends
          </h1>
        </div>
      </div>

      <div className="flex gap-4">
        <Logbutton text="Signin" onclick={() => router.push("/signin")} />
        <Logbutton text="Signup" onclick={() => router.push("/signup")} />
      </div>
    </div>
  );
}

interface logprops {
  text: string;
  onclick: () => void;
}

function Logbutton({ text, onclick }: logprops) {
  return (
    <button
      onClick={onclick}
      className="p-4 font-bold text-3xl bg-blue-400 rounded-md"
    >
      {text}
    </button>
  );
}
