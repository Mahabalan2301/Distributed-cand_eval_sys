require("dotenv").config();

const createLogger = require("./shared/logger");
const logger = createLogger("auth-service");

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

const crypto = require("crypto");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const PORT = process.env.PORT || 5000;

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
    await prisma.application.create({
      data: {
        candidateId: user.id,
        status: "Applied",
      },
    });

    logger.info("New candidate registered", { userId: user.id, email });
    res.json({ message: "User registered successfully" });
  } catch (err) {
    logger.error("Registration error", { error: err.message, email: req.body.email });
    res.status(PORT).json({ error: "User already exists or error occurred" });
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

// 🔐 User Profile (Me)
app.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const user = await prisma.candidate.findUnique({
      where: { id: userId },
      include: {
        applications: {
          include: { score: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// 🔄 Reset Assessment (Manual Override)
app.post("/reset-assessment", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const lastApp = await prisma.application.findFirst({
      where: { candidateId: userId, status: "Attempted" },
      orderBy: { createdAt: "desc" }
    });

    if (lastApp) {
      await prisma.application.update({
        where: { id: lastApp.id },
        data: { status: "Evaluated" } // Mark as evaluated with no score to unlock dashboard
      });
      return res.json({ message: "Assessment reset successfully" });
    }

    res.status(400).json({ error: "No stuck assessment found" });
  } catch (err) {
    res.status(401).json({ error: "Failed to reset" });
  }
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

    // 🔄 Find existing applications
    const lastApp = await prisma.application.findFirst({
      where: { candidateId: userId },
      orderBy: { createdAt: "desc" }
    });

    let applicationId;

    // Logic for new attempt vs continue
    if (!lastApp || lastApp.status === "Evaluated") {
      // 🆕 Create NEW application for a fresh attempt
      const newApp = await prisma.application.create({
        data: {
          candidateId: userId,
          status: "Attempted",
        },
      });
      applicationId = newApp.id;
    } else {
      // 🔄 Update current pending application
      await prisma.application.update({
        where: { id: lastApp.id },
        data: { status: "Attempted" },
      });
      applicationId = lastApp.id;
    }

    const nonce = crypto.randomBytes(16).toString("hex");

    const assessmentToken = jwt.sign(
      { userId, nonce, applicationId },
      JWT_SECRET,
      { expiresIn: "5m" } // Slightly longer for comfort
    );

    await redis.set(`nonce:${nonce}`, "valid", "EX", 120);

    logger.info("Assessment session started", { userId, applicationId, nonce });
    res.json({ token: assessmentToken });

  } catch (err) {
    logger.error("Start assessment error", { error: err.message });
    res.status(401).json({ error: "Invalid token" });
  }
});


app.post("/validate-assessment", async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);

    const { nonce, userId, applicationId } = decoded;

    const exists = await redis.get(`nonce:${nonce}`);

    if (!exists) {
      return res.status(401).json({ error: "Token already used or invalid" });
    }

    // ❗ Delete nonce → single use
    await redis.del(`nonce:${nonce}`);

    res.json({ message: "Token valid", userId, applicationId });

  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});


app.get("/questions", async (req, res) => {
  const questions = await prisma.question.findMany();
  res.json(questions);
});
app.post("/submit", async (req, res) => {
  try {
    const { answers, userId, applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: "Missing applicationId" });
    }

    // 1️⃣ Store responses (linked to candidate)
    for (const qId in answers) {
      await prisma.response.create({
        data: {
          candidateId: userId,
          questionId: qId,
          selected: answers[qId],
        },
      });
    }

    // 2️⃣ Publish event to Redis
    await redis.publish("evaluation", JSON.stringify({ userId, applicationId }));

    logger.info("Submission received", { userId, applicationId });
    res.json({ message: "Submission received. Evaluating..." });

  } catch (err) {
    logger.error("Submit error", { error: err.message, userId, applicationId });
    res.status(PORT).json({ error: "Submission failed" });
  }
});

app.get("/candidates", async (req, res) => {
  const candidates = await prisma.candidate.findMany({
    include: {
      applications: true,
      scores: true,
    },
  });

  res.json(candidates);
});
// 🔥 SSE clients store
let clients = [];

// 🔥 SSE endpoint
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});
app.post("/notify", (req, res) => {
  const data = JSON.stringify(req.body);

  clients.forEach(c => {
    c.write(`data: ${data}\n\n`);
  });

  res.sendStatus(200);
});
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

module.exports = app;
