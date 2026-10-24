import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketsApi } from "../api/client";
import { Ticket, TicketStatus, TicketPriority } from "../types";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { AIInsightsPanel } from "../components/AIInsightsPanel";
import { ConversationSummarizerModal } from "../components/ConversationSummarizerModal";
import { SimilarTicketsModal } from "../components/SimilarTicketsModal";
import { AssignAgentModal } from "../components/AssignAgentModal";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  User,
  Clock,
  Send,
  Lock,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle,
  RotateCcw,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Message composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Modals
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [isSimilarOpen, setIsSimilarOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Status actions
  const [resolving, setResolving] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [showResolvePrompt, setShowResolvePrompt] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenPrompt, setShowReopenPrompt] = useState(false);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      const data = await ticketsApi.getById(id);
      setTicket(data);
    } catch (err) {
      console.error("Failed to load ticket", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await ticketsApi.addMessage(ticket.id, replyText.trim(), isInternalNote);
      setReplyText("");
      await fetchTicket();
    } catch (err) {
      console.error("Failed to post message", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await ticketsApi.update(ticket.id, { status: newStatus });
      await fetchTicket();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleResolve = async () => {
    if (!ticket || !resolutionText.trim()) return;
    setResolving(true);
    try {
      await ticketsApi.resolve(ticket.id, resolutionText.trim());
      setShowResolvePrompt(false);
      setResolutionText("");
      await fetchTicket();
    } catch (err) {
      console.error("Failed to resolve", err);
    } finally {
      setResolving(false);
    }
  };

  const handleReopen = async () => {
    if (!ticket || !reopenReason.trim()) return;
    try {
      await ticketsApi.reopen(ticket.id, reopenReason.trim());
      setShowReopenPrompt(false);
      setReopenReason("");
      await fetchTicket();
    } catch (err) {
      console.error("Failed to reopen", err);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isStaff = user?.role === "admin" || user?.role === "agent";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tickets")}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-indigo-600">{ticket.ticket_number}</span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <span className="text-xs text-slate-400">• {ticket.category_name || "General"}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 leading-snug">{ticket.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isStaff && (
            <>
              <button
                onClick={() => setIsSummarizerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Summarize Thread</span>
              </button>

              <button
                onClick={() => setIsSimilarOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Similar Resolved</span>
              </button>

              <button
                onClick={() => setIsAssignOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Reassign Agent</span>
              </button>
            </>
          )}

          {/* Resolve / Reopen Flow */}
          {ticket.status !== "resolved" && ticket.status !== "closed" && isStaff && (
            <button
              onClick={() => setShowResolvePrompt(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </button>
          )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <button
              onClick={() => setShowReopenPrompt(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Resolution Prompt Box */}
      {showResolvePrompt && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-emerald-900 uppercase">Confirm Ticket Resolution</h4>
          <textarea
            rows={2}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="Explain the solution applied so future support searches can reference this fix..."
            className="w-full p-2.5 bg-white border border-emerald-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResolvePrompt(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving || !resolutionText.trim()}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {resolving ? "Resolving..." : "Complete Resolution"}
            </button>
          </div>
        </div>
      )}

      {/* Reopen Prompt Box */}
      {showReopenPrompt && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-purple-900 uppercase">Provide Reason for Reopening</h4>
          <input
            type="text"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Why does this issue require further investigation?"
            className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowReopenPrompt(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleReopen}
              disabled={!reopenReason.trim()}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              Confirm Reopen
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Conversation, Right AI Panel & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Problem Description Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Submitted by {ticket.customer_name} ({ticket.customer_email})
              </span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Conversation History Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversation History</h3>
            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((m) => {
                const isCust = m.sender_role === "customer";
                const isInternal = m.is_internal;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl p-4 transition ${
                      isInternal
                        ? "bg-amber-50/70 border border-amber-200 text-amber-950"
                        : isCust
                        ? "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                        : "bg-indigo-50/60 border border-indigo-100 text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {m.sender_name} {isCust ? "(Customer)" : `(${m.sender_role})`}
                        </span>
                        {isInternal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900">
                            <Lock className="w-3 h-3" />
                            STAFF ONLY NOTE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No replies posted yet. Send the first response below.
              </div>
            )}
          </div>

          {/* Response Composer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    !isInternalNote
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Public Reply to Customer
                </button>
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      isInternalNote
                        ? "bg-amber-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1" />
                    Internal Note (Staff Only)
                  </button>
                )}
              </div>

              {ticket.ai_analysis?.suggested_response && !isInternalNote && (
                <button
                  type="button"
                  onClick={() => setReplyText(ticket.ai_analysis?.suggested_response || "")}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Apply AI Draft
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  isInternalNote
                    ? "Add a private technical note or diagnostic finding (never visible to customer)..."
                    : "Draft your customer reply here. Be courteous, clear, and actionable..."
                }
                className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400">
                  {isInternalNote ? (
                    <span className="text-amber-700 font-medium">Secured: Only visible to authenticated staff.</span>
                  ) : (
                    <span>Customer will receive an instant notification update.</span>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 ${
                    isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? "Sending..." : isInternalNote ? "Save Staff Note" : "Send Response"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: AI Insights Panel & Ticket Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Ticket Details</h3>

            <div className="space-y-3 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Agent</span>
                <span className="font-semibold text-slate-800">
                  {ticket.assigned_agent_name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer</span>
                <span className="font-medium text-slate-800">{ticket.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created At</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">First Response</span>
                  <span className="text-emerald-700 font-medium">
                    {new Date(ticket.first_response_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolved At</span>
                  <span className="text-emerald-700 font-semibold">
                    {new Date(ticket.resolved_at).toLocaleString()}
                  </span>
                </div>
              )}
              {ticket.resolution_time_minutes && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution Time</span>
                  <span className="font-bold text-indigo-700">{ticket.resolution_time_minutes} minutes</span>
                </div>
              )}
            </div>

            {/* Status Quick Changer for Staff */}
            {isStaff && (
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Update Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="reopened">Reopened</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>

          {/* AI Insights Panel */}
          <AIInsightsPanel
            ticket={ticket}
            analysis={ticket.ai_analysis}
            onAnalysisUpdated={(a) => setTicket({ ...ticket, ai_analysis: a })}
            onInsertDraft={(draft) => {
              setReplyText(draft);
              setIsInternalNote(false);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <ConversationSummarizerModal
        ticketId={ticket.id}
        ticketTitle={ticket.title}
        isOpen={isSummarizerOpen}
        onClose={() => setIsSummarizerOpen(false)}
      />

      <SimilarTicketsModal
        initialQuery={ticket.title}
        isOpen={isSimilarOpen}
        onClose={() => setIsSimilarOpen(false)}
        onUseResolution={(resText) => {
          setReplyText(prev => prev ? `${prev}\n\nResolution guide: ${resText}` : `Resolution guide: ${resText}`);
        }}
      />

      <AssignAgentModal
        ticketId={ticket.id}
        currentAgentId={ticket.assigned_agent_id}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={(agentName) => {
          setTicket({ ...ticket, assigned_agent_name: agentName });
        }}
      />
    </div>
  );
};
