# SmartDesk AI - Database Schema Documentation

## Database Overview
The PostgreSQL database schema is normalized to third normal form (3NF), enforces foreign key constraints with explicit cascade rules, indexes high-cardinality lookups, and supports semantic similarity matching via `pgvector`.

## Entity Relationship Overview
```
users (Admin, Agent, Customer)
  |-- customer_tickets --> tickets
  |-- assigned_tickets --> tickets
  |-- agent_categories <-- ticket_categories
  |-- messages         --> ticket_messages
  |-- audit_logs       --> audit_logs

tickets
  |-- ticket_messages   (Customer replies, Agent replies, Staff-only internal notes)
  |-- ticket_assignments (Assignment timestamps & algorithmic reasoning)
  |-- ticket_ai_analyses (Predicted category, urgency 1-10, solutions, confidence)
  |-- ticket_embeddings (Vector embeddings of problem and resolution text)
```

## Table Specifications

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `full_name` | VARCHAR(255) | NOT NULL | Display name |
| `hashed_password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | `admin`, `agent`, or `customer` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Account creation date |

### 2. `ticket_categories`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Category ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| `description` | VARCHAR(255) | NULLABLE | Detailed description |
| `is_active` | BOOLEAN | NOT NULL | Active flag |

### 3. `tickets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique ticket UUID |
| `ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable identifier (e.g. TICK-1001) |
| `customer_id` | UUID | FK -> `users(id)` | Author of the ticket |
| `title` | VARCHAR(255) | NOT NULL | Ticket subject |
| `description` | TEXT | NOT NULL | Problem narrative |
| `category_id` | UUID | FK -> `ticket_categories(id)` | Ticket category |
| `priority` | VARCHAR(20) | NOT NULL | `low`, `medium`, `high`, `critical` |
| `status` | VARCHAR(20) | NOT NULL | `open`, `in_progress`, `resolved`, `closed`, `reopened` |
| `urgency_score` | INTEGER | CHECK (1-10) | AI-estimated urgency rating |
| `assigned_agent_id`| UUID | FK -> `users(id)` | Assigned support agent |
| `first_response_at`| TIMESTAMPTZ | NULLABLE | Timestamp of first staff response |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | Resolution completion timestamp |
| `reopened_at` | TIMESTAMPTZ | NULLABLE | Reopening timestamp |

### 4. `ticket_messages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Message UUID |
| `ticket_id` | UUID | FK -> `tickets(id)` | Ticket reference |
| `sender_id` | UUID | FK -> `users(id)` | Author |
| `message` | TEXT | NOT NULL | Message body |
| `is_internal` | BOOLEAN | NOT NULL | True for private staff notes, false for customer-visible replies |
| `created_at` | TIMESTAMPTZ | NOT NULL | Timestamp |
