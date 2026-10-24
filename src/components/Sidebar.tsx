import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  BarChart3,
  Users,
  Bot,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "agent", "customer"] },
    { label: "Tickets", icon: Inbox, path: "/tickets", roles: ["admin", "agent", "customer"] },
    { label: "New Ticket", icon: PlusCircle, path: "/tickets/new", roles: ["admin", "agent", "customer"] },
    { label: "Analytics", icon: BarChart3, path: "/analytics", roles: ["admin", "agent"] },
    { label: "Agent Roster", icon: Users, path: "/admin/agents", roles: ["admin"] },
  ];

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight leading-none">SmartDesk</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">AI Support Suite</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 hidden md:flex items-center justify-center"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role Pill in Footer */}
      {!collapsed && user && (
        <div className="p-3 m-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role: {user.role.toUpperCase()}</span>
          </div>
          <p className="text-[11px] truncate">{user.email}</p>
        </div>
      )}
    </aside>
  );
};
