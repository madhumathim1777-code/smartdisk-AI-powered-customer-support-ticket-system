export type UserRole = "admin" | "agent" | "customer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed" | "reopened";

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  ticket_id: string;
  predicted_category?: string;
  urgency_score?: number;
  suggested_priority?: TicketPriority;
  predicted_sentiment?: string;
  summary?: string;
  suggested_solutions?: string[];
  suggested_response?: string;
  confidence?: number;
  reasoning?: string;
  status: "pending" | "completed" | "failed";
  error_message?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  title: string;
  description: string;
  category_id?: string;
  category_name?: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment?: string;
  urgency_score?: number;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  resolved_at?: string;
  reopened_at?: string;
  resolution_time_minutes?: number;
  messages?: Message[];
  ai_analysis?: AIAnalysis;
}

export interface SimilarTicket {
  id: string;
  ticket_number: string;
  title: string;
  category: string;
  status: string;
  resolution_summary: string;
  similarity_score: number;
  created_at: string;
}

export interface AnalyticsSummary {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  high_priority_tickets: number;
  avg_resolution_time_hours: number;
  overdue_tickets: number;
  reopened_tickets: number;
}

export interface TrendData {
  date: string;
  created: number;
  resolved: number;
}

export interface CategoryMetric {
  category: string;
  count: number;
}

export interface PriorityMetric {
  priority: string;
  count: number;
}

export interface AgentWorkloadMetric {
  agent_id: string;
  agent_name: string;
  assigned_count: number;
  resolved_count: number;
  avg_resolution_time_hours: number;
}

export interface AnalyticsOverview {
  summary: AnalyticsSummary;
  trends: TrendData[];
  by_category: CategoryMetric[];
  by_priority: PriorityMetric[];
  agent_workload: AgentWorkloadMetric[];
}

export interface AgentProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  supported_categories: string[];
  active_ticket_count: number;
  created_at: string;
}
