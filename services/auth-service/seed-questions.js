const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding questions...");

  // Clear existing questions first to avoid duplicates if you run it multiple times
  await prisma.question.deleteMany();

  const questions = [
    {
      question: "In the CAP theorem, what does 'P' stand for?",
      options: ["Performance", "Partition Tolerance", "Parallelism", "Persistence"],
      answer: 1
    },
    {
      question: "Which protocol is commonly used for Clock Synchronization in distributed systems?",
      options: ["NTP", "HTTP", "FTP", "SMTP"],
      answer: 0
    },
    {
      question: "What is the primary purpose of the Paxos algorithm?",
      options: ["Data Encryption", "Load Balancing", "Consensus", "Packet Routing"],
      answer: 2
    },
    {
      question: "What does SSE stand for in web development?",
      options: ["Simple Socket Events", "Server-Sent Events", "Secure Session Entry", "Script Side Execution"],
      answer: 1
    },
    {
      question: "What is 'Replica Lag' in a distributed database setup?",
      options: [
        "The time taken to create a backup", 
        "The delay between a write on the leader and its reflection on a follower", 
        "The distance between physical data centers", 
        "The version mismatch between client and server"
      ],
      answer: 1
    }
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log("✅ Seeded 5 questions successfully.");
}

seed()
  .catch(e => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
