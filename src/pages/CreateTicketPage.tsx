import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, ticketsApi } from "../api/client";
import { Category, Ticket } from "../types";
import { AIInsightsPanel } from "../components/AIInsightsPanel";
import { Bot, Sparkles, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const CreateTicketPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const ticket = await ticketsApi.create({
        title,
        description,
        category_id: categoryId || undefined,
        priority,
      });
      setCreatedTicket(ticket);
    } catch (err) {
      console.error("Ticket creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Support Ticket</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit your problem details. SmartDesk AI will automatically classify, triage urgency, and route to a specialist.
        </p>
      </div>

      {!createdTicket ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ticket Title / Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cannot access dashboard after SSO migration"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category (Optional)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Let AI Predict Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to allow Gemini NLP to classify category automatically.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="medium">Medium - Standard issue</option>
                  <option value="high">High - Business impact</option>
                  <option value="critical">Critical - System down / outage</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue with exact error messages, reproduction steps, or unexpected system behavior..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                AI will triage urgency & draft recommended solutions on submission
              </span>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Support Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Instant Success & AI Analysis Showcase */
        <div className="space-y-6">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Ticket Successfully Created!</h3>
                <p className="text-xs text-emerald-800">
                  Assigned Identifier: <span className="font-bold">{createdTicket.ticket_number}</span> • Routed to:{" "}
                  <span className="font-semibold">{createdTicket.assigned_agent_name || "Support Pool"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/tickets/${createdTicket.id}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <span>Open Ticket Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* AI Insights Card */}
          <AIInsightsPanel
            ticket={createdTicket}
            analysis={createdTicket.ai_analysis}
            onAnalysisUpdated={(a) => setCreatedTicket({ ...createdTicket, ai_analysis: a })}
          />
        </div>
      )}
    </div>
  );
};
