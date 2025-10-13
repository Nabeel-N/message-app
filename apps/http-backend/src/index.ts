import "dotenv/config";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { JWT_SECRET } from "./config";
import { prisma } from "@repo/db/client";
import * as bcrypt from "bcrypt";
import { authenticateToken } from "./middleware";

const app = express();
app.use(express.json());
app.use(cors());

async function find_slug(slug: string, userid: string): Promise<boolean> {
  const findroom = await prisma.room.findUnique({
    where: {
      slug: slug
    }
  })
  return !!findroom;
}
async function Atuthorization(userId: string, slug: string): Promise<boolean> {
  if (!userId) {
    return false;
  }
  const finduserId = await prisma.room.findFirst({
    where: {
      slug: slug,
      users: {
        some: {
          id: userId,
        }
      }
    }
  })
  if (!finduserId) {
    return false;
  }
  console.log(finduserId);

  return !!finduserId;
}

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usercreation = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: usercreation.id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "User created successfully",
      token: token,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/signin", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      message: " email, and password are required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(200).json({
    message: "Logged in successfully",
    token: token,
  });
});

app.post("/api/create-room", authenticateToken, async (req: Request, res: Response) => {
  try {
    const decodeduser = (req as any).user;
    const userId = decodeduser.userId
    if (!userId) {
      return res.status(401).send("Userid is not found");
    }

    const slug = req.body.slug;

    if (typeof slug != "string" && userId === undefined || null) {
      res.status(401).json({
        message: "slug cannot be empty"
      })
      return;
    }
    const findslug = await find_slug(slug, userId);
    if (findslug) {
      return res.status(401).json({
        message: "room already Present"
      });
    }

    const createroom = await prisma.room.create({
      data: {
        slug: slug,
        adminId: userId,
        users: {
          connect: {
            id: userId
          }
        }
      }
    })
    res.status(201).json({
      message: createroom
    })
    console.log(createroom);
  } catch (e) {
    console.error(e + "error from the create-room")
    res.status(500).json({
      error: "Internal Server Error"
    })
  }

})


app.get("/api/me/rooms", authenticateToken, async (req, res) => {
  try {

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        message: "User is not authenticated"
      })
    }
    const userwithrooms = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        rooms: true
      }
    })

    if (!userwithrooms) {
      return res.status(404).json({
        message: "user not found"
      })
    }
    return res.status(201).json({
      room: userwithrooms.rooms
    })
  } catch (e) {
    console.error(e + "api/me/rooms did not found the user");
    res.status(500).json({ message: "Internal Server Error" });
  }


})



app.get("/api/rooms/:slug/messages", authenticateToken, async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const decodeduser = (req as any).user;
  const userId = decodeduser.userId;
  if (!userId) {
    res.status(401).send("Userid is not found in token");
  }
  const auth = await Atuthorization(userId, slug as string);
  if (!auth) {
    return res.status(403).json({ message: "Forbidden: You are not a member of this room." });
  }
  const fetchmessages = await prisma.chat.findMany({
    where: {
      room: {
        slug: slug,
      },
    },

    orderBy: {
      createdAt: "desc"
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          photo: true,

        },

      }
    },
    take: 50,
  })
  return res.status(200).json(fetchmessages);
})



const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
