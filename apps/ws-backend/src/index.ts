import "dotenv/config";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server started on port 8080");

interface UserInfo {
  userId: string;
  rooms: string[];
  isAlive: boolean;
}

const client = new Map<WebSocket, UserInfo>();
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

// This event fires when a new client connects
wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  console.log("A new client connected!");
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

  client.set(ws, {
    userId: userid,
    rooms: [],
    isAlive: true,
  });

  // Send a welcome message to the newly connected client
  ws.send("Welcome to the WebSocket server!");

  // This event fires when the server receives a message from this specific client
  ws.on("message", (message: string) => {
    console.log(`Received message from client: ${message}`);

    // Echo the message back to the client
    ws.send(`You said: ${message}`);
  });

  // This event fires when the client disconnects
  ws.on("close", () => {
    console.log("Client has disconnected.");
  });

  // This event fires if there's an error with the client's connection
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
