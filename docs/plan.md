# Project Initial Plan: DistriEval

## 🎯 Goal
Build a decentralized, microservices-based candidate evaluation system that scales horizontally and handles high-concurrency event processing.

## 🏗️ Architecture Design Principles
1. **Decoupling**: Each portal (Candidate, Employer, Assessment) is a standalone application talking to a central API Gateway.
2. **Asynchronicity**: Evaluation scoring must be handled by background workers to prevent blocking the user interface.
3. **Fault Tolerance**: Use of message queues (Redis) to ensure no evaluation tasks are lost during service restarts.
4. **Security**: Multi-app transitions secured by one-time nonces and JWT validation.

## 🗺️ Roadmap
### Phase 1: Core Portals & Authentication
- Build Candidate Portal (Next.js)
- Build Auth Service (Express/Prisma)
- Implement JWT-based session management.

### Phase 2: Assessment Engine & Workers
- Build isolated Assessment Engine.
- Implement Redis-based event triggers.
- Build Evaluation Worker for asynchronous scoring.

### Phase 3: API Gateway & Deployment
- Implement Express-based Reverse Proxy (API Gateway).
- Deploy to Vercel (Frontends) and Render (Backends).
- Configure Supabase for managed PostgreSQL.

### Phase 4: Reliability Refactor (Current State)
- Transition from Pub/Sub to Redis Lists (LPUSH/BLPOP) for zero-loss message queues.
- Implement database indexing and idempotent scoring logic.
