# API Design & Gateway Specification

## 🚪 API Gateway (Reverse Proxy)

The **API Gateway** is the single entry point for all frontend portals. It abstracts the microservice architecture, providing a unified `https://api-gateway...` endpoint.

### 🛠️ Key Responsibilities
- **Path-Based Routing**:
  - `/auth/*` → Proxeid to `Auth Service`
  - `/evaluation/*` → Proxied to `Evaluation Worker` (Future)
- **Error Shielding**: Returns a standard `502 Service Unavailable` if an internal microservice is down, preventing client-side breakage.
- **Header Normalization**: Ensures CORS and security headers are consistent across all services.

## 🛰️ Auth Service Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Create a new candidate | No |
| `POST` | `/login` | Authenticate and get JWT | No |
| `GET` | `/me` | Get current candidate profile & history | JWT |
| `POST` | `/start-assessment` | Generate one-time secure test token | JWT |
| `POST` | `/submit` | Submit answers and trigger queue | JWT |
| `GET` | `/questions` | Fetch assessment question bank | No (Internal) |
| `POST` | `/notify` | Callback for worker to update scores | Private API Key |

## 🔄 Server-Sent Events (SSE)

The system uses a persistent SSE connection at `GET /auth/events` to broadcast real-time updates.
- **Clients**: Candidate Portal, Employer Dashboard.
- **Events**: `evaluation_complete`, `new_application`.
- **Latency**: Near-zero delay once the worker finishes processing.
