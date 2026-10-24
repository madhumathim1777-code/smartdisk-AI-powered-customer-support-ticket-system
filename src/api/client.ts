import axios from "axios";
import {
  Ticket,
  AIAnalysis,
  AnalyticsOverview,
  Category,
  SimilarTicket,
  AgentProfile,
  User,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdesk_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (email: string, full_name: string, password: string) => {
    const res = await api.post("/auth/register", { email, full_name, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },
};

export const ticketsApi = {
  list: async (params?: {
    search?: string;
    category_id?: string;
    status?: string;
    priority?: string;
    agent_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const res = await api.get<{
      items: Ticket[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>("/tickets", { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<Ticket>(`/tickets/${id}`);
    return res.data;
  },
  create: async (data: { title: string; description: string; category_id?: string; priority?: string }) => {
    const res = await api.post<Ticket>("/tickets", data);
    return res.data;
  },
  update: async (id: string, data: Partial<Ticket>) => {
    const res = await api.patch<Ticket>(`/tickets/${id}`, data);
    return res.data;
  },
  addMessage: async (id: string, message: string, is_internal = false) => {
    const res = await api.post(`/tickets/${id}/messages`, { message, is_internal });
    return res.data;
  },
  assign: async (id: string, agent_id: string, reason?: string) => {
    const res = await api.post(`/tickets/${id}/assign`, { agent_id, reason });
    return res.data;
  },
  resolve: async (id: string, resolution_note: string) => {
    const res = await api.post(`/tickets/${id}/resolve`, { resolution_note });
    return res.data;
  },
  reopen: async (id: string, reason: string) => {
    const res = await api.post(`/tickets/${id}/reopen`, { reason });
    return res.data;
  },
};

export const aiApi = {
  analyze: async (ticket_id: string) => {
    const res = await api.post<AIAnalysis>(`/tickets/${ticket_id}/analyze`);
    return res.data;
  },
  summarize: async (ticket_id: string) => {
    const res = await api.post<{
      summary: string;
      main_problem: string;
      troubleshooting_steps: string[];
      unresolved_questions: string[];
      recommended_next_action: string;
    }>(`/tickets/${ticket_id}/summarize`);
    return res.data;
  },
  draftResponse: async (ticket_id: string) => {
    const res = await api.post<{ suggested_response: string; rationale: string }>(
      `/tickets/${ticket_id}/draft-response`
    );
    return res.data;
  },
  searchSimilar: async (query: string, limit = 5) => {
    const res = await api.post<SimilarTicket[]>("/search/similar-tickets", { query, limit });
    return res.data;
  },
};

export const analyticsApi = {
  getOverview: async () => {
    const res = await api.get<AnalyticsOverview>("/analytics/overview");
    return res.data;
  },
};

export const adminApi = {
  getAgents: async () => {
    const res = await api.get<AgentProfile[]>("/admin/agents");
    return res.data;
  },
  createAgent: async (data: { email: string; full_name: string; password: string; category_ids?: string[] }) => {
    const res = await api.post<AgentProfile>("/admin/agents", data);
    return res.data;
  },
  updateAgent: async (id: string, data: { is_active?: boolean; full_name?: string; category_ids?: string[] }) => {
    const res = await api.patch<AgentProfile>(`/admin/agents/${id}`, data);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<Category[]>("/admin/categories");
    return res.data;
  },
};

export default api;
