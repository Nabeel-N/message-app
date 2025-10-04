import "dotenv/config";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { prisma } from "@repo/db/client";
import { send } from "process";
import { userInfo } from "os";

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server started on port 8080");

interface UserInfo {
  userId: string;
  rooms: string[];
  isAlive: boolean;
}

const clients = new Map<WebSocket, UserInfo>();

function checktoken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string" || !decoded?.userId) {
      return null;
    }
    return decoded.userId;
  } catch (e) {
    console.error("there is a error from checktoken " + e);
    return null;
  }
}


// This event fires when a new clients connects
wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  console.log("A new clients connected!");
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userid = checktoken(token);

  if (!userid) {
    ws.close(1008, "unauthorized");
    return;
  }

  clients.set(ws, {
    userId: userid,
    rooms: [],
    isAlive: true,
  });

  ws.on("pong", () => {
    const userinfo = clients.get(ws);
    if (!userinfo) {
      return;
    } else {
      userinfo.isAlive = true;
    }
  });

  ws.send("Welcome to the WebSocket server!");

  //event fires when recieves a message
  ws.on("message", async (message: Buffer) => {
    console.log("message, async (message: string)");

    const messageString = message.toString();
    const data = JSON.parse(messageString);
    const wsfromclient = clients.get(ws);
    const userid = wsfromclient?.userId;
    if (!data) {
      return;
    }

    if (data.type == "join-room") {
      const slug = data.slug.toString();
      if (!slug || typeof slug !== 'string') {
        return ws.send(JSON.stringify({ error: "room slug is required and it must be a string" }));
      }

      const findslug = wsfromclient?.rooms.includes(slug);
      if (findslug) {
        return ws.send(JSON.stringify({ error: "room already exists" }));
      } else {

        prisma.room.update({
          where: {
          },

        })
      }

    });

  // This event fires when the clients disconnects
  ws.on("close", () => {
    console.log("Client has disconnected.");
  });

  // This event fires if there's an error with the clients's connection
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
