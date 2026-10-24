import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { analyticsApi, ticketsApi } from "../api/client";
import { AnalyticsOverview, Ticket } from "../types";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, tList] = await Promise.all([
          analyticsApi.getOverview(),
          ticketsApi.list({ page: 1, page_size: 5 }),
        ]);
        setData(overview);
        setRecentTickets(tList.items);
      } catch (err) {
        console.error("Dashboard data load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary } = data;

  const statCards = [
    { label: "Total Tickets", value: summary.total_tickets, icon: Inbox, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Open Tickets", value: summary.open_tickets, icon: Clock, color: "text-sky-700", bg: "bg-sky-50" },
    { label: "In Progress", value: summary.in_progress_tickets, icon: TrendingUp, color: "text-indigo-700", bg: "bg-indigo-50" },
    { label: "Resolved", value: summary.resolved_tickets, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "High / Critical", value: summary.high_priority_tickets, icon: Flame, color: "text-rose-700", bg: "bg-rose-50" },
    { label: "Avg Resolution", value: `${summary.avg_resolution_time_hours} hrs`, icon: Clock, color: "text-purple-700", bg: "bg-purple-50" },
    { label: "Overdue (>48h)", value: summary.overdue_tickets, icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Reopened", value: summary.reopened_tickets, icon: RotateCcw, color: "text-teal-700", bg: "bg-teal-50" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time metrics, AI triage statistics, and agent performance</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Ticket</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tickets Activity (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Created vs. Resolved Volume</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="created" name="Created" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Tickets by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution across service tiers</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.by_category}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {data.by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {data.by_category.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {cat.category}
                </span>
                <span className="font-semibold text-slate-800">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Agent Workload & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Workload Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Support Agent Workload</h3>
            </div>
            <Link to="/admin/agents" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Manage Roster &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Active Tickets</th>
                  <th className="py-2.5 px-3">Resolved</th>
                  <th className="py-2.5 px-3">Avg Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.agent_workload.map((ag) => (
                  <tr key={ag.agent_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{ag.agent_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ag.assigned_count} active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{ag.resolved_count}</td>
                    <td className="py-2.5 px-3 text-slate-500">{ag.avg_resolution_time_hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Tickets Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Ticket Activity</h3>
            <Link to="/tickets" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">{t.ticket_number}</span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{t.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    From {t.customer_name} • {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  to={`/tickets/${t.id}`}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                  title="View ticket"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
