
"use client";
import { useRouter } from "next/navigation";

export default function Roompage() {
  const router = useRouter();

  return (
    <div className="w-full h-screen">
      <div className="flex items-center justify-center ">
        <div className="bg-green-600 border-8 px-40 py-40  mt-40  rounded-full overflow-hidden ">
          <h1 className="text-6xl font-bold bg-gradient-to-t from-indigo-500 via-violet-300 to-rose-500 rounded-full p-4">
            Chat with your friends
          </h1>
        </div>
      </div>
      <Logbutton text="Signin" onclick={router.push("/signin")} />
      <Logbutton text="Signup" onclick={router.push("/signup")} />
    </div>
  );
}

interface logprops {
  text: string;
  onclick: void;
}
function Logbutton({ text, onclick }: logprops) {
  return <button onClick={() => onclick} className="p-4 font-bold text-3xl bg-blue-400 ml-72 mt-2 rounded-md">{text}</button>
}



