
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");
const redis = new Redis();

const crypto = require("crypto");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 🔐 Register
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.candidate.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "User already exists or error occurred" });
  }
});

// 🔐 Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.candidate.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// 🔐 Start Assessment (Secure Token)
app.post("/start-assessment", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId;

    const nonce = crypto.randomBytes(16).toString("hex");

    const assessmentToken = jwt.sign(
      { userId, nonce },
      JWT_SECRET,
      { expiresIn: "2m" }
    );

    await redis.set(`nonce:${nonce}`, "valid", "EX", 120);

    res.json({ token: assessmentToken });

  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/validate-assessment", async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);

    const { nonce } = decoded;

    const exists = await redis.get(`nonce:${nonce}`);

    if (!exists) {
      return res.status(401).json({ error: "Token already used or invalid" });
    }

    // ❗ Delete nonce → single use
    await redis.del(`nonce:${nonce}`);

    res.json({ message: "Token valid", userId: decoded.userId });

  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

app.get("/questions", async (req, res) => {
  const questions = await prisma.question.findMany();
  res.json(questions);
});
app.post("/submit", async (req, res) => {
  const { answers } = req.body;

  const questions = await prisma.question.findMany();

  let score = 0;

  questions.forEach((q) => {
    if (answers[q.id] === q.answer) {
      score++;
    }
  });

  res.json({ score });
});
app.listen(5000, () => {
  console.log("Auth service running on port 5000");
});