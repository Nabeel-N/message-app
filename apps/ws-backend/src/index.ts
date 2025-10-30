import "dotenv/config";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { prisma } from "@repo/db/client";

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(port) });
console.log(`WebSocket server started on port ${port}`);

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

  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "welcome to WebSocket server!",
    })
  );
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
      const slug = data.slug;
      if (!slug || typeof slug !== "string") {
        return ws.send(
          JSON.stringify({
            error: "room slug is required and it must be a string",
          })
        );
      }

      const existingroom = await prisma.room.findUnique({
        where: {
          slug: slug,
        },
      });

      if (existingroom) {
        wsfromclient?.rooms.push(slug);
        return ws.send(
          JSON.stringify({ type: "joined-existing-room", slug: slug })
        );
      }
      const createroom = await prisma.room.create({
        data: {
          slug: slug,
          admin: {
            connect: {
              id: userid,
            },
          },
          users: {
            connect: { id: userid },
          },
        },
      });

      wsfromclient?.rooms.push(slug);
      ws.send(JSON.stringify({ type: "room-created", slug: createroom }));
      console.log(createroom);
    }

    if (data.type === "chat") {
      try {
        const roomId = data.roomId;
        const message = data.message;
        const userId = wsfromclient?.userId;
        const savedChat = await prisma.chat.create({
          data: {
            message: message,
            user: {
              connect: {
                id: userId,
              },
            },
            room: {
              connect: {
                slug: roomId.toString(),
              },
            },
          },
        });
        const chatwithuser = await prisma.chat.findUnique({
          where: {
            id: savedChat.id,
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        });
        clients.forEach((userInfo: UserInfo, ws: WebSocket) => {
          if (userInfo.rooms.includes(roomId)) {
            ws.send(
              JSON.stringify({
                type: "new message",
                chat: chatwithuser,
              })
            );
          }
        });
        console.log(savedChat);
      } catch (e) {
        console.error(e + "this is a error from chat");
      }
    }
  });

  // This event fires when the clients disconnects
  ws.on("close", () => {
    console.log("Client has disconnected.");
  });

  // This event fires if there's an error with the clients's connection
  ws.on("close", () => {
    console.log("Client has disconnected.");
    clients.delete(ws);
  });
});

const interval = setInterval(() => {
  clients.forEach((u: UserInfo, w: WebSocket) => {
    if (u.isAlive == false) {
      console.log(`Terminating inactive connection for user: ${u.userId}`);
      w.terminate();
    }
    u.isAlive = false;
    w.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});
