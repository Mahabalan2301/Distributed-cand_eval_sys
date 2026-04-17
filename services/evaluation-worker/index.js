if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");

const createLogger = require("./shared/logger");
const logger = createLogger("evaluation-worker");

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const BACKEND_URL = process.env.AUTH_SERVICE_URL;

if (!BACKEND_URL) {
  throw new Error("AUTH_SERVICE_URL not set");
}

logger.info("Evaluation worker started and listening to 'evaluation_queue'");

async function processQueue() {
  try {
    // BLPOP blocks for 30 seconds waiting for a message from the queue
    const result = await redis.blpop("evaluation_queue", 30);
    
    if (result) {
      const [_queueName, message] = result;
      let userId;
      let applicationId;

      try {
        const data = JSON.parse(message);
        userId = data.userId;
        applicationId = data.applicationId;

        logger.info("Evaluation requested from queue", { userId, applicationId });

        if (!applicationId) {
          throw new Error("Missing applicationId in evaluation request");
        }

        const responses = await prisma.response.findMany({
          where: { candidateId: userId },
          orderBy: { id: 'desc' }
        });
        
        // Filter to only keep the latest response per question
        const uniqueResponses = Array.from(
          responses.reduce((map, r) => {
            if (!map.has(r.questionId)) map.set(r.questionId, r);
            return map;
          }, new Map()).values()
        );

        const questions = await prisma.question.findMany();
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

        // ✅ Update status
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: "Evaluated" },
        });

        logger.info("Database updated and notification sending", { userId, applicationId, score });
        await notifyBackend({ userId, applicationId, score, status: "success" });

      } catch (err) {
        logger.error("Evaluation processing error", { error: err.message, userId, applicationId });
        if (userId) {
          await notifyBackend({ userId, applicationId, error: "Evaluation failed", status: "error" });
        }
      }
    }
  } catch (err) {
    logger.error("Queue loop error", { error: err.message });
    // Wait a bit before retrying if there's a connection error
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Continue the loop
  setImmediate(processQueue);
}

// Start the processing loop
processQueue();



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
const http = require("http");

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Worker is running");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Worker health server running on port ${PORT}`);
});