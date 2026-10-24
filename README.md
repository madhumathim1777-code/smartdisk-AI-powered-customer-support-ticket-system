# SmartDesk AI - AI-Powered Customer Support Ticket Management Platform

SmartDesk AI is an enterprise-grade customer support platform that automates ticket triage, urgency assessment, sentiment analysis, agent routing, semantic similarity search, and conversation summarization using Google Gemini (`gemini-3.8-flash`).

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide Icons, Axios
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, Official Google Gen AI SDK (`google-genai`), Passlib, Python-Jose
- **Full-Stack Runtime**: Express TypeScript proxy server with Vite middleware integration (`server.ts`) for zero-configuration preview
- **Database**: PostgreSQL 16 with `pgvector` extension for semantic embedding similarity distance (`<=>`), with documented keyword fallback
- **AI Models**:
  - Triage, Urgency, Solutions, Summarization: `gemini-3.8-flash`
  - Semantic Embeddings: `gemini-embedding-2-preview`

---

## 2. Default Seed & Demo Credentials

SmartDesk AI includes realistic demonstration accounts across all 3 user tiers:

| Role | Name | Email | Password | Specialized Category |
|---|---|---|---|---|
| **Administrator** | Eleanor Vance | `admin@smartdesk.ai` | `Password123!` | All / System Admin |
| **Support Agent** | Sarah Chen | `sarah.chen@smartdesk.ai` | `Password123!` | Technical Issue, Feature Request |
| **Support Agent** | Marcus Vance | `marcus.vance@smartdesk.ai` | `Password123!` | Billing & Payments, Order & Shipping |
| **Support Agent** | Priya Patel | `priya.patel@smartdesk.ai` | `Password123!` | Account Access & 2FA |
| **Customer** | Alex Miller | `alex.miller@acme.com` | `Password123!` | Self-Service Customer |

*Tip: The web UI top bar includes an **Instant Role Switcher** (`Admin` | `Agent` | `Customer`) allowing immediate testing of role permissions, customer ticket isolation, and staff-only internal notes.*

---

## 3. Quick Start (Development Server)

To launch the full-stack interactive application:

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 4. Standalone Python FastAPI Backend Setup

### Prerequisites
- Python 3.10+
- PostgreSQL 15+ (with `pgvector` extension)

### Step 1: Create PostgreSQL Database & Enable pgvector
In your PostgreSQL prompt:
```sql
CREATE DATABASE smartdesk_db;
\c smartdesk_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Configure Environment Variables
Copy the example environment configuration:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
DATABASE_URL=postgresql://smartdesk:smartdesk_password@localhost:5432/smartdesk_db
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
EMBEDDING_MODEL=gemini-embedding-2-preview
SECRET_KEY=generate_a_random_secure_hex_key_here
FRONTEND_ORIGIN=http://localhost:3000
```

### Step 3: Install Python Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4: Run Migrations & Seed Demo Data
```bash
# Run database migrations
alembic upgrade head

# Seed realistic demonstration data (Admin, 3 Agents, Customers, 20+ Tickets)
psql -U smartdesk -d smartdesk_db -f ../database/seed.sql
```

### Step 5: Start FastAPI Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger UI is available at `http://localhost:8000/docs`.

---

## 5. Running Automated Tests

Run backend tests using Pytest:
```bash
cd backend
pytest -v
```

Tests cover:
- Authentication, registration, and password hashing
- Role-based authorization & internal note isolation (customers cannot see staff notes)
- Ticket creation, status transitions, and resolution timing
- Workload-based auto-assignment algorithm
- Graceful offline fallback when Gemini API keys are omitted or rate-limited
- Real-time analytics calculations from database records

---

## 6. Docker Compose Setup

Run the entire stack with PostgreSQL (`pgvector`), FastAPI backend, and React frontend with a single command:

```bash
docker-compose up --build
```

Services started:
- `smartdesk-postgres`: PostgreSQL 16 with pgvector on port `5432`
- `smartdesk-backend`: FastAPI backend on port `8000`
- `smartdesk-frontend`: React frontend on port `3000`

---

## 7. Key Features Implemented

1. **AI Ticket Classification & Urgency**: Evaluates ticket descriptions and assigns urgency scores (1-10), priority tags, sentiment, and category.
2. **AI Suggested Troubleshooting & Replies**: Generates actionable diagnostic steps and polite response drafts for agents to review and insert.
3. **AI Conversation Summarizer**: Generates executive briefings identifying the main problem, attempted actions, unresolved questions, and next steps.
4. **pgvector Semantic Search**: Discovers historically resolved tickets matching customer issues with similarity scores and previous resolutions.
5. **Deterministic Workload-Based Auto-Assignment**: Assigns incoming tickets to qualified active agents based on category expertise and active workload balancing.
6. **Internal Staff Notes**: Supports private internal staff diagnostic notes strictly hidden from customer view via backend query isolation.
7. **Performance Analytics Dashboard**: Live metrics for resolution velocity, average resolution hours, SLA overdue tickets, and agent workload distribution.
8. **Agent Management**: Administrators can add agents, configure category specialties, and toggle active queue status.

---

## 8. Troubleshooting

- **PostgreSQL pgvector extension missing**:
  If your PostgreSQL distribution does not have pgvector installed, SmartDesk AI automatically falls back to full-text search and transparently tags results as keyword-based fallback.
- **Gemini API Key Rate Limits or Offline**:
  The system includes an automatic deterministic heuristic parser that categorizes tickets and calculates urgency safely so no customer ticket is ever lost.
