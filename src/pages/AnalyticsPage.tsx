import React, { useState, useEffect } from "react";
import { analyticsApi } from "../api/client";
import { AnalyticsOverview } from "../types";
import {
  Download,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  RotateCcw,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getOverview().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary } = data;
  const resolutionRate = summary.total_tickets > 0
    ? Math.round((summary.resolved_tickets / summary.total_tickets) * 100)
    : 0;

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Total Tickets,${summary.total_tickets}\n` +
      `Open Tickets,${summary.open_tickets}\n` +
      `In Progress Tickets,${summary.in_progress_tickets}\n` +
      `Resolved Tickets,${summary.resolved_tickets}\n` +
      `Resolution Rate,${resolutionRate}%\n` +
      `Avg Resolution Hours,${summary.avg_resolution_time_hours}\n` +
      `Overdue Tickets,${summary.overdue_tickets}\n` +
      `Reopened Tickets,${summary.reopened_tickets}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartdesk_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Performance & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited database metrics on resolution velocity, volume trends, agent productivity, and AI triage accuracy.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Resolution Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{resolutionRate}%</span>
            <span className="text-xs text-slate-400">completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Mean Resolution Duration</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600">{summary.avg_resolution_time_hours}</span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Calculated from closed tickets</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Overdue SLA Breaches</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{summary.overdue_tickets}</span>
            <span className="text-xs text-slate-400">tickets &gt; 48h</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requires priority routing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Reopened Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-600">{summary.reopened_tickets}</span>
            <span className="text-xs text-slate-400">recycled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Post-resolution follow-ups</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Ticket Throughput (7 Days)</h3>
          <p className="text-xs text-slate-400 mb-4">Daily inflow vs. completed resolutions</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Area type="monotone" dataKey="created" name="Created" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Tickets by Priority Tier</h3>
          <p className="text-xs text-slate-400 mb-4">Volume according to criticality level</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_priority}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" name="Tickets" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Agent Performance & Velocity Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">Productivity metrics extracted directly from resolution timestamps</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Support Agent</th>
                <th className="py-3 px-4">Currently Assigned</th>
                <th className="py-3 px-4">Successfully Resolved</th>
                <th className="py-3 px-4">Mean Resolution Time</th>
                <th className="py-3 px-4 text-right">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.agent_workload.map((ag) => (
                <tr key={ag.agent_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{ag.agent_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-indigo-700">{ag.assigned_count}</span> active
                  </td>
                  <td className="py-3 px-4 font-medium text-emerald-700">{ag.resolved_count} resolved</td>
                  <td className="py-3 px-4">{ag.avg_resolution_time_hours} hours</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Optimal Throughput
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
