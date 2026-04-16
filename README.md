# 🚀 DistriEval: Distributed Candidate Evaluation System


A state-of-the-art, real-time distributed system for managing and evaluating candidate technical assessments. This project features a decoupled architecture spanning multiple portals and microservices, connected via Redis and PostgreSQL.

## 🏗️ System Architecture

1.  **API Gateway (Port 8000)**: [NEW] The single entry point for all frontend applications. Handles routing and proxying to internal services.
2.  **Candidate Portal (Port 3000)**: Where students register, login, and view their performance history.
3.  **Employer Dashboard (Port 3001)**: A real-time monitoring tool for recruiters to track candidate progress and scores.
4.  **Assessment Engine (Port 3002)**: A secure, isolated environment for taking tests using one-time tokens.
5.  **Auth Service (Port 5000)**: Internal service handling authentication, assessment coordination, and real-time event broadcasting (SSE).
6.  **Evaluation Worker**: Internal service that listens to Redis, calculates scores asynchronously, and updates the database.

## 🛠️ Technical Stack

### **Frontend & UI**
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Data Visualization**: Recharts (for performance progress)
- **Icons**: Lucide React

### **Backend & Infrastructure**
- **Runtime**: Node.js
- **API**: Express.js (Service & Gateway)
- **Monitoring**: Structured JSON Logging (via internal logger)
- **Database ORM**: Prisma (Optimized with indexes)
- **Primary Database**: PostgreSQL
- **Message Broker**: Redis (Pub/Sub for evaluation events)
- **Security**: JWT & Nonce-based secure test sessions
- **Testing**: Jest & Supertest (Backend coverage)

## 🌟 Key Features Implemented

### **1. API Gateway Decoupling**
Frontend applications no longer talk directly to the Auth Service. All requests are routed through the **API Gateway**, allowing for easier service replacement and better security scaling.

### **2. Structured JSON Logging**
All backend services (`auth-service`, `evaluation-worker`, `api-gateway`) now emit structured JSON logs. This enables professional-grade observability and log analysis in production environments.

### **3. Optimized Database Performance**
The Prisma schema has been enhanced with composite and single-field indexes on `candidateId`, `questionId`, `status`, and `applicationId` to eliminate full table scans in hot query paths.

### **4. Full Docker Orchestration**
The entire ecosystem—databases, microservices, and the gateway—can be spun up with one command, ensuring environment parity between development and production.

## 🏃 Getting Started

### **1. Complete System (Docker Compose)**
The recommended way to run the backend and infrastructure:
```powershell
docker compose up --build
```
This starts: `postgres`, `redis`, `auth_service`, `evaluation_worker`, and `api_gateway`.

### **2. Running Tests**
To verify the backend logic:
```powershell
cd services/auth-service
npm test
```

### **3. Portals**
Start the frontend applications locally:
```powershell
# Candidate Portal
cd apps/candidate-portal
npm run dev

# Employer Dashboard
cd apps/employer-dashboard
npm run dev

# Assessment Engine
cd apps/assessment-engine
npm run dev
```

---
*Developed with a focus on enterprise-grade observability, high performance, and premium user experience.*
