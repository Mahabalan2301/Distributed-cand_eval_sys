# Database Schema Design

## 🗄️ Database: PostgreSQL (via Supabase)

We use Prisma as our ORM to maintain type safety across the distributed system.

### 📐 Entity Relationship Model

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| **Candidate** | Core user account | Has many Applications, Responses, Scores |
| **Question** | Assessment bank | Linked via Response.questionId |
| **Application** | A specific test attempt | Linked to Candidate; Has one Score |
| **Response** | Individual answer | Linked to Candidate and Question |
| **Score** | Final calculated result | Linked to Application and Candidate |

### 🚀 Performance Optimizations

#### 1. Indexing Strategy
To ensure low latency during recruitment cycles, we implemented the following indexes:
- `@@index([status])` on Candidate: For fast filtering by recruiters.
- `@@index([createdAt])` on Candidate: For latest-first sorting.
- `@@index([candidateId])` on Application: For fast retrieval of personal history.
- `@@index([applicationId])` on Score: Unique index to ensure 1:1 relationship between attempts and results.

#### 2. Enum vs String Consideration
While PostgreSQL supports Enums, we chose **Plain Text (`TEXT`) with defaults** for our status columns (`APPLIED`, `ATTEMPTED`, `EVALUATED`).
- **Rationale**: Better compatibility with distributed Prisma clients and easier schema evolution without migration locks.
- **Safety**: Validations are handled at the application logic layer within the Auth Service.

#### 3. Idempotent Data Model
The `Score` table uses a unique constraint on `applicationId`. This allows our Evaluation Worker to "upsert" scores Safely. Even if a Redis message is processed twice, the database remains consistent.
