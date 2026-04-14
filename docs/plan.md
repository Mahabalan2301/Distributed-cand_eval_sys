# Distributed Candidate Evaluation Platform — System Plan

## 1. System Architecture

The system is designed as a distributed, event-driven platform with multiple independent applications and backend services.

### Monorepo Structure

apps/

* candidate-portal — login, dashboard, entry point
* assessment-engine — MCQ interface, submission
* employer-dashboard — real-time candidate insights

services/

* auth-service — authentication, token issuance/validation
* api-gateway — request routing (single entry point)
* evaluation-worker — asynchronous scoring

packages/

* shared-types — shared contracts
* utils — reusable helpers

---

## 2. Component Breakdown

### Candidate Portal

* Handles login/register
* Displays dashboard
* Initiates assessment flow

### Assessment Engine

* Separate application
* Validates token
* Renders MCQ test
* Submits answers

### Employer Dashboard

* Displays candidate funnel:
  Applied → Attempted → Evaluated
* Shows scores
* Updates in real-time

### Auth Service

* Issues JWT
* Generates secure assessment tokens
* Validates tokens

### API Gateway

* Central entry point for APIs
* Routes requests to services

### Evaluation Worker

* Consumes Redis events
* Computes score
* Stores results

---

## 3. Technology Choices

| Layer       | Tech              | Reason                      |
| ----------- | ----------------- | --------------------------- |
| Frontend    | Next.js           | SSR + routing + scalability |
| Backend     | Node.js + Express | Lightweight microservices   |
| ORM         | Prisma            | Type-safe DB access         |
| Database    | PostgreSQL        | Relational consistency      |
| Cache/Queue | Redis             | Fast pub/sub + TTL          |
| Auth        | JWT               | Stateless secure auth       |
| Realtime    | SSE/WebSocket     | Live dashboard updates      |

---

## 4. Data Flow

### Authentication Flow

User → Candidate Portal → Auth Service
→ Validate credentials → Generate JWT → Return

---

### Cross-App Assessment Flow

User clicks Start Assessment
→ Request sent to Auth Service
→ Generate short-lived token (nonce + JWT)
→ Store nonce in Redis
→ Redirect to Assessment Engine

---

### Submission Flow (Asynchronous)

Assessment Engine → Submit answers
→ Store submission in PostgreSQL
→ Publish event to Redis

---

### Evaluation Pipeline

Redis → evaluation-worker
→ Compute score
→ Store in PostgreSQL

---

### Real-Time Update Flow

Worker → Redis pub/sub
→ Backend → Employer Dashboard
→ UI updates automatically

---

## 5. Pseudocode Sketch

### Token Generation

generate nonce
create JWT(userId + nonce)
store nonce in Redis with TTL
return token

---

### Submission

save answers
publish event to Redis
return success immediately

---

### Worker

listen to Redis
calculate score
store result

---

## 6. Data Model Overview

* Candidates (id, email, status)
* Applications (candidateId, status)
* Questions (text, options, answer)
* Responses (candidateId, answers)
* Scores (candidateId, score)

Indexes:

* candidateId
* status
* timestamps

---

## 7. Risks & Open Questions

### Risks

* Replay attacks → solved via nonce
* Multiple submissions → restrict using DB check
* Redis failure → fallback to DB queue
* Token expiry issues

### Open Questions

* Should retakes be allowed?
* How to handle partial submissions?
* Should scoring support negative marking?

---

## 8. Task Breakdown

### Phase 1

* Monorepo setup
* Docker (Postgres + Redis)

### Phase 2

* Auth system (login/register)

### Phase 3

* Cross-app token system

### Phase 4

* Assessment Engine (MCQ UI)

### Phase 5

* Submission + Redis pipeline

### Phase 6

* Worker (async scoring)

### Phase 7

* Employer dashboard (real-time)

---

## 9. Approach

The system will be built incrementally:

1. Start with authentication
2. Implement secure cross-app flow
3. Build assessment engine
4. Add asynchronous evaluation pipeline
5. Implement real-time dashboard

Focus is on correctness, modularity, and system design rather than UI complexity.

---
