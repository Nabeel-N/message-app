import "dotenv/config";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
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

  ws.on("pong", (ws: WebSocket) => {
    const userinfo = clients.get(ws);
    if (!userinfo) {
      return;
    } else {
      userinfo.isAlive == true;
    }
  });

  // Send a welcome message to the newly connected clients
  ws.send("Welcome to the WebSocket server!");

  // This event fires when the server receives a message from this specific clients
  ws.on("message", (message: string) => {
    console.log(`Received message from clients: ${message}`);
    const parseddata = JSON.parse(message.toString());
    const userinfo = clients.get(ws);
    if (!userinfo) {
      return;
    }

    

    // Echo the message back to the clients
    ws.send(`You said: ${message}`);
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
