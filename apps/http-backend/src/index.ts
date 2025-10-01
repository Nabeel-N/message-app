import "dotenv/config";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { JWT_SECRET } from "./config";
import { prisma } from "@repo/db/client";
import * as bcrypt from "bcrypt";

const app = express();
app.use(express.json());
app.use(cors());

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




const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
