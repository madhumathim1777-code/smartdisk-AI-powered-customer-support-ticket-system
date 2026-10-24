import React, { useState, useEffect } from "react";
import { adminApi } from "../api/client";
import { AgentProfile, Category } from "../types";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  Lock,
  Tag,
} from "lucide-react";

export const AgentManagementPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Agent Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ags, cats] = await Promise.all([adminApi.getAgents(), adminApi.getCategories()]);
      setAgents(ags);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load agent roster", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (agent: AgentProfile) => {
    try {
      await adminApi.updateAgent(agent.id, { is_active: !agent.is_active });
      await fetchData();
    } catch (err) {
      console.error("Failed to toggle agent status", err);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createAgent({
        email: newEmail,
        full_name: newName,
        password: newPassword,
        category_ids: selectedCats,
      });
      setIsAddOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setSelectedCats([]);
      await fetchData();
    } catch (err) {
      console.error("Failed to create agent", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Agent Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure agent skill categories, activate or pause agent queues, and monitor live workloads.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      {/* Agents Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Category Specialties</th>
                <th className="py-3 px-4">Active Workload</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Queue Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading agent directory...
                  </td>
                </tr>
              ) : (
                agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {ag.full_name.charAt(0)}
                      </div>
                      <span>{ag.full_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{ag.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-slate-800">{ag.role}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ag.supported_categories.length > 0 ? (
                          ag.supported_categories.map((cName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {cName}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">All Categories (General)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-indigo-700">{ag.active_ticket_count} tickets</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {ag.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(ag)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                          ag.is_active
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {ag.is_active ? "Deactivate" : "Activate Queue"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agent Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-indigo-700">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Add New Support Agent</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jordan.hayes@smartdesk.ai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Category Specialties</label>
                <div className="space-y-1.5">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCats.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Register Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
