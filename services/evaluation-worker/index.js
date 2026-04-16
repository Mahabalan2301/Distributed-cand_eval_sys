if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");
const fetch = require("node-fetch");
const createLogger = require("./shared/logger");
const logger = createLogger("evaluation-worker");

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const BACKEND_URL = process.env.AUTH_SERVICE_URL;

if (!BACKEND_URL) {
  throw new Error("AUTH_SERVICE_URL not set");
}

logger.info("Evaluation worker started and subscribed to 'evaluation' channel");
redis.subscribe("evaluation");


redis.on("message", async (channel, message) => {
  let userId;
  let applicationId;
  try {
    const data = JSON.parse(message);
    userId = data.userId;
    applicationId = data.applicationId;

    logger.info("Evaluation requested", { userId, applicationId });

    if (!applicationId) {
      throw new Error("Missing applicationId in evaluation request");
    }


    const responses = await prisma.response.findMany({
      where: { candidateId: userId },
      orderBy: { id: 'desc' }
    });
    console.log(`📝 Found ${responses.length} total raw responses.`);

    // 💡 Filter to only keep the latest response per question
    const uniqueResponses = Array.from(
      responses.reduce((map, r) => {
        if (!map.has(r.questionId)) map.set(r.questionId, r);
        return map;
      }, new Map()).values()
    );

    console.log(`🎯 Evaluating ${uniqueResponses.length} unique responses.`);

    const questions = await prisma.question.findMany();
    console.log(`❓ Total questions in DB: ${questions.length}`);

    let score = 0;

    uniqueResponses.forEach((r) => {
      const q = questions.find(q => q.id === r.questionId);
      if (q && r.selected === q.answer) score++;
    });

    logger.info("Score calculated", { userId, applicationId, score });


    // ✅ Save score linked to Application (Idempotent)
    await prisma.score.upsert({
      where: { applicationId: applicationId },
      update: { score },
      create: {
        candidateId: userId,
        applicationId: applicationId,
        score,
      },
    });

    // ✅ Update status of specific application
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "Evaluated" },
    });


    logger.info("Database updated and notification sent", { userId, applicationId, score });

    // 🔥 Notify backend (Success)
    await notifyBackend({ userId, applicationId, score, status: "success" });

  } catch (err) {
    logger.error("Evaluation error", { error: err.message, userId, applicationId });
    if (userId) {
      // 🔥 Notify backend (Failure) to stop the client-side spinner
      await notifyBackend({ userId, applicationId, error: "Evaluation failed", status: "error" });
    }
  }
});



async function notifyBackend(data) {
  try {
    const res = await fetch(`${BACKEND_URL}/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      console.log(`✅ Notification (${data.status}) sent successfully.`);
    } else {
      console.error(`❌ Notification (${data.status}) failed with status:`, res.status);
    }
  } catch (err) {
    console.error("❌ Failed to contact notification service:", err.message);
  }
}
// Dummy server for Render health check
require("http")
  .createServer((req, res) => {
    res.end("Worker is running");
  })
  .listen(process.env.PORT || 10000, () => {
    console.log("Worker health server running");
  });