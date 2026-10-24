# SmartDesk AI - REST API Documentation

All API routes are prefixed by `/api`. Authenticated endpoints require an `Authorization: Bearer <token>` header.

## Authentication Endpoints

### 1. `POST /api/auth/register`
Registers a new customer account.
- **Request Body**: `{ "email": "...", "full_name": "...", "password": "..." }`
- **Response**: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

### 2. `POST /api/auth/login`
Authenticates user and returns JWT token.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

### 3. `GET /api/auth/me`
Retrieves authenticated user profile.

---

## Tickets Endpoints

### 4. `POST /api/tickets`
Creates a new support ticket, saves it to PostgreSQL, triggers Gemini AI analysis, and auto-assigns an agent.
- **Request Body**: `{ "title": "...", "description": "...", "category_id": "...", "priority": "..." }`

### 5. `GET /api/tickets`
Retrieves paginated, filtered, and searchable tickets.
- **Query Params**: `search`, `category_id`, `status`, `priority`, `agent_id`, `page`, `page_size`

### 6. `GET /api/tickets/{ticket_id}`
Returns full ticket details. Note: If the requester is a Customer, internal staff notes are omitted from the response.

### 7. `POST /api/tickets/{ticket_id}/messages`
Appends a conversation reply or private internal note.
- **Request Body**: `{ "message": "...", "is_internal": false }`

### 8. `POST /api/tickets/{ticket_id}/assign`
Reassigns ticket to an agent (Staff only).
- **Request Body**: `{ "agent_id": "...", "reason": "..." }`

### 9. `POST /api/tickets/{ticket_id}/resolve`
Marks ticket as resolved and logs resolution note.
- **Request Body**: `{ "resolution_note": "..." }`

### 10. `POST /api/tickets/{ticket_id}/reopen`
Reopens a previously resolved ticket.
- **Request Body**: `{ "reason": "..." }`

---

## AI Endpoints

### 11. `POST /api/tickets/{ticket_id}/analyze`
Manually retriggers or refreshes Gemini triage analysis.

### 12. `POST /api/tickets/{ticket_id}/summarize`
Runs Gemini conversation summarization to extract problem, actions taken, unresolved items, and next recommended action.

### 13. `POST /api/tickets/{ticket_id}/draft-response`
Generates an empathetic, context-aware draft reply for the agent to review before sending.

### 14. `POST /api/search/similar-tickets`
Performs vector similarity search (or keyword fallback) against previously resolved tickets.
- **Request Body**: `{ "query": "Unable to receive 2FA code", "limit": 5 }`

---

## Analytics Endpoints

### 15. `GET /api/analytics/overview`
Returns summary metrics (Total, Open, In Progress, Resolved, Avg Resolution Time, Overdue), trends over time, category breakdowns, and agent workloads.
