"use client";

import React, { ReactNode } from "react";
import Image from 'next/image';
import { useState } from "react";
import { motion } from "motion/react"
import { div } from "framer-motion/client";
//parent
export default function App() {
  return <div className="h-screen w-full">
    <div className="ml-7 mr-7 mb-7 h-[850px] mt-4  rounded-xl bg-gradient-to-b from-orange-800  via-orange-200 via-20% to-orange-800 to-90%  ">
      <div className="flex justify-center items-center">
        <Navbar />
      </div>
      <div className="mt-7 bg-white p-1.5 flex items-center justify-center w-[190px] mx-auto rounded-md">
        <Navbar_text text="Increase Aov Value" fontsize="text-sm" />
      </div>
      <div className="mt-3">
        <h1 className="text-black font-semibold text-4xl flex items-center justify-center">Cut Support Tickets & Let </h1>
        <h1 className="text-black  font-semibold text-4xl flex items-center justify-center">Customers Edit Orders</h1>
      </div>
      <div className="mt-2">
        <h1 className=" text-black flex items-center justify-center">Let Customers Edit Orders Themselves:Save your customers time</h1>
        <h1 className=" text-black flex items-center justify-center">and yourself from support email headaches</h1>
      </div>
      <div className="flex space-x-3 mt-6 justify-center items-center">
        <div className=" font-medium text-orange-700 bg-white p-2 rounded-md">
          Get Demo
        </div>
        <Install_Custom text={"install Customizer"} />
      </div>
      <div className="relative mt-2">
        <Card />
        <div className="absolute  top-[-120px] left-8 rotate-12">
          <Slidediv text="Change Quantities / Remove Itmes" />
          <div className="mt-2">
            <Slidedowndiv />
          </div>
        </div>
        <div className="absolute top-[-120px] right-8 -rotate-12">
          <Slidediv text="Change Quantities / Remove Itmes" />
          <div className="mt-2">
            <Slidedowndiv />
          </div>
        </div>
      </div>
      {/* Right side */}
      <div className="relative">
        <div className="absolute top-[-120px] right-8 rotate-12">
          <div className="ml-10 space-y-2">
            <Slidediv text="Change Quantities / Remove Itmes" />
          </div>
          <div className="ml-6 mt-2 mr-8 space-y-2">
            <CardSmall />
          </div>
        </div>
      </div>

      {/* Left side - mirror of right */}
      <div className="relative">
        <div className="absolute top-[-120px] left-8 -rotate-12">
          <div className="ml-10 space-y-2">
            <Slidediv text="Change Quantities / Remove Itmes" />
          </div>
          <div className="mr-6 mt-2 ml-8 space-y-2">
            <CardSmall />
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-row space-x-2">
      <Cardbelow size="p-30" color=" bg-gradient-to-b from-orange-800  via-orange-200 via-20% to-orange-800 to-90%" text="Card below" rounded="large" />
      <Cardbelow size="p-30" color=" bg-gradient-to-b from-orange-800  via-orange-200 via-20% to-orange-800 to-90%" text="Card below" rounded="large" />
      <Cardbelow size="p-30" color=" bg-gradient-to-b from-orange-800  via-orange-200 via-20% to-orange-800 to-90%" text="Card below" rounded="large" />
    </div>
    <Footer />
  </div>
}
function Navbar() {
  const navtext = "Install Customizer";
  const hometextsize = "text-sm"
  const hiwsize = "text-sm"
  const resourcestextsize = "text-sm"

  return <div className="bg-white  border rounded-xl  flex items-center justify-between p-3 w-1/2 mt-2 ">
    <Navbar_text text="Home" fontsize={hometextsize} />
    <Navbar_text text="How it works" fontsize={hiwsize} />
    <Navbar_text text="Resources" fontsize={resourcestextsize} />
    <Install_Custom text={navtext} />
  </div>
}

interface InstallProps {
  text: string;
}
function Install_Custom({ text }: InstallProps) {
  return <div className="bg-orange-600 border-orange-400 font-semibold text-white p-1.5   w-[180px] rounded-xl flex justify-center items-center ">
    {text}
  </div>
}

interface Text {
  text: string;
  fontsize: string
}
function Navbar_text({ text, fontsize }: Text) {
  return <h1 className={`text-black ${fontsize} font-medium bg-white`}>{text} </h1>
}
function Card() {
  return (
    <div className="flex items-center justify-center ">
      <div className="pt-4 pb-4 mb-2 pl-14 pr-14  shadow-neutral-700 w-96 bg-stone-100 rounded-3xl shadow-md">
        <h1 className="mb-3 font-semibold text-xl text-black">
          🎉 Your Order Is Completed
        </h1>
        <Card_photo />
        <div className="px-2 py-2 flex items-center justify-center mt-8 w-full text-lg font-medium decoration-from-font text-white bg-gradient-to-l border-4 border-white rounded-3xl">Edit orders</div>
        <div className="flex space-x-1 items-center justify-center">
          <h1 className="text-black text-sm">You have</h1>
          <h1 className="text-orange-500 text-sm">29 min </h1>
          <h1 className="text-black text-sm">to edit</h1>
        </div>
      </div>
    </div>
  );
}

function Card_photo() {
  return (
    <div className="flex items-center px-6  py-6 rounded-3xl relative overflow-hidden  border-2">
      <div className="w-20 h-24 rounded-xl border-2 flex-shrink-0 relative overflow-hidden bg-orange-300 mask-radial-center">
        <Image
          src="/black tshirt.jpg" // Renamed to remove the space
          alt="Product"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col space-y-2 ml-4 flex-1">
        <Shadediv size="w-full" />
        <Shadediv size="w-1/2" />
        <h1 className="font-semibold text-2xl text-emerald-500">15$</h1>
        <h1 className="text-zinc-400 text-sm">Quantity1</h1>
      </div>
    </div>
  );
}
interface ShadedivProps {
  size: string;
}

function Shadediv({ size }: ShadedivProps) {
  return <div className={`rounded-xl bg-gray-300 h-4 ${size}`}></div>;
}
interface SlidedivProps {
  text: ReactNode;
}
function Slidediv({ text }: SlidedivProps) {
  return <div className=" w-[275px] p-1 text-black rounded-md  bg-white font-medium text-md">{text}</div>
}
function Slidedowndiv() {
  return <div className="px-34 py-10 rounded-xl bg-white overflow-hidden   border-1 border-stone-500">
    <div className="flex items-center justify-center mb-12">
      <div className=" text-md text-zinc-600 font-normal p-2 w-[260px] rounded-xl bg-gray-300">
        +9101234567
      </div>
    </div>
    <div className="flex items-center justify-center mt-6">
      <div className="p-2 text-zinc-600 font-normal w-[260px] rounded-xl bg-gray-300 ">
        email@example.com
      </div>
    </div>
  </div>
}


function CardSmall() {
  return <div className="bg-white  rounded-xl px-34 ml-4 mr-12 mb-32 py-6 w-[260px]">

    <div className="ml-1">
      <h1 className="text-black font-medium text-md">Phone</h1>
    </div>
    <div className="justify-center ml-1 items-center">
      <div className="bg-gray-300 p-4 rounded-2xl w-[250px] " >
      </div>
    </div>
  </div>
}
interface CardbelowProps {
  size: string;
  color: string;
  text: ReactNode;
  rounded: "small" | "large" | "medium";
}
function Cardbelow({ size, color, text, rounded }: CardbelowProps) {
  return <div className={` w-1/3  ${size} ${color} ${rounded === "large" ? "rounded-3xl" : "rounded-md"} border-2 py-40  border-white`}>{text}</div>
}

function Footer() {
  return <div className="p-20 overflow-hidden bg-gradient-to-b mt-2 from-yellow-300 to rounded-3xl  w-full">
    <div className="bg-red-400 p-4 rounded-full w-fit">

    </div>
  </div>
}
