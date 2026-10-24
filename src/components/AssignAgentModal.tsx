import React, { useState, useEffect } from "react";
import { adminApi, ticketsApi } from "../api/client";
import { AgentProfile } from "../types";
import { UserCheck, X } from "lucide-react";

interface AssignAgentModalProps {
  ticketId: string;
  currentAgentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (agentName: string) => void;
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
  ticketId,
  currentAgentId,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || "");
  const [reason, setReason] = useState("Manual reassignment by supervisor");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adminApi.getAgents().then(setAgents).catch(console.error);
      setSelectedAgentId(currentAgentId || "");
    }
  }, [isOpen, currentAgentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setSubmitting(true);
    try {
      const res = await ticketsApi.assign(ticketId, selectedAgentId, reason);
      onAssigned(res.agent_name || "Agent");
      onClose();
    } catch (err) {
      console.error("Assignment failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Assign Support Agent</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Agent</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose an Agent --</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id} disabled={!ag.is_active}>
                  {ag.full_name} ({ag.active_ticket_count} active tickets) {!ag.is_active ? "[Inactive]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assignment Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Category specialization re-route"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedAgentId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
