# SmartDesk AI - System Architecture

## 1. High-Level Overview
SmartDesk AI is an intelligent customer support ticket platform built with an event-driven, decoupled full-stack architecture. It transforms raw customer complaints and inquiries into structured, triaged, and actionable support workflows using Google Gemini models.

```
       +-------------------------------------------------------------+
       |               React 19 SPA (Vite + Tailwind)                |
       |  Admin Portal | Agent Workspace | Customer Self-Service     |
       +------------------------------+------------------------------+
                                      | REST APIs (JSON / Bearer JWT)
                                      v
       +-------------------------------------------------------------+
       |           FastAPI / Express Full-Stack Application          |
       |  - JWT Authentication & RBAC (Admin, Agent, Customer)       |
       |  - Ticket Lifecycle & Auto-Assignment Engine                |
       |  - SLA & Resolution Duration Tracking                       |
       |  - Analytics & Aggregation Engine                           |
       +------------------+-----------------------+------------------+
                          |                       |
            SQLAlchemy /  |                       | Official Google GenAI SDK
            PgVector      v                       v (gemini-3.8-flash)
       +---------------------------+   +-----------------------------+
       |    PostgreSQL Database    |   |     Google Gemini API       |
       | - pgvector Extension      |   | - Structured JSON Triage    |
       | - Normalized Tables       |   | - Urgency & Sentiment (1-10)|
       | - Audit Logs & History    |   | - Solution Recommendations  |
       | - Internal Note Security  |   | - Conversation Summarizer   |
       +---------------------------+   +-----------------------------+
```

## 2. Core Subsystems

### A. Role-Based Access Control (RBAC)
- **Administrator**: Global ticket control, agent provisioning, skill/category configuration, performance analytics, and CSV exports.
- **Support Agent**: View assigned tickets, update statuses, publish customer responses, record private internal notes, execute conversation summarization, and discover similar resolved tickets.
- **Customer**: Submit tickets, track ticket timeline, respond to agents, reopen eligible resolved tickets. Internal notes are strictly excluded at database query level.

### B. Gemini AI Pipeline
1. **Intelligent Triage & Urgency**: When a ticket is created or updated, Gemini analyzes the text, assigns an urgency score (1-10), recommends a priority (`low`, `medium`, `high`, `critical`), predicts sentiment (`Frustrated`, `Neutral`, `Urgent`, etc.), and extracts an issue summary.
2. **Deterministic Fallback**: If network interruptions or rate limits occur, SmartDesk AI automatically activates a deterministic heuristic parser ensuring tickets are never lost.
3. **Conversation Summarization**: Generates an actionable briefing identifying the core issue, attempted troubleshooting steps, open questions, and next steps.
4. **Semantic Vector Search**: Uses vector embeddings to identify historically resolved tickets with similar symptoms and suggests battle-tested resolutions.

### C. Auto-Assignment Engine
- Matches ticket category against agent specialties.
- Evaluates active ticket workloads.
- Assigns to the least loaded qualified agent with audit logging.
