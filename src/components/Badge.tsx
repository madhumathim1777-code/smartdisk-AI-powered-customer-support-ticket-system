import React from "react";
import { TicketPriority, TicketStatus } from "../types";

export const PriorityBadge: React.FC<{ priority?: TicketPriority | string }> = ({ priority = "medium" }) => {
  const p = priority.toLowerCase();
  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  if (p === "critical") {
    styles = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
  } else if (p === "high") {
    styles = "bg-amber-50 text-amber-700 border-amber-200 font-medium";
  } else if (p === "medium") {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (p === "low") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: TicketStatus | string }> = ({ status = "open" }) => {
  const s = status.toLowerCase();
  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let label = status;

  if (s === "open") {
    styles = "bg-sky-50 text-sky-700 border-sky-200";
    label = "Open";
  } else if (s === "in_progress") {
    styles = "bg-indigo-50 text-indigo-700 border-indigo-200";
    label = "In Progress";
  } else if (s === "resolved") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "Resolved";
  } else if (s === "closed") {
    styles = "bg-slate-100 text-slate-600 border-slate-200";
    label = "Closed";
  } else if (s === "reopened") {
    styles = "bg-purple-50 text-purple-700 border-purple-200 font-medium";
    label = "Reopened";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {label}
    </span>
  );
};
