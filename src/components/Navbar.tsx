import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";
import { Sparkles, LogOut, UserCircle } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Environment:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Gemini 3.8 Flash Powered
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Evaluation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium px-2 py-0.5 hidden sm:inline">Switch Role:</span>
          {(["admin", "agent", "customer"] as UserRole[]).map((r) => {
            const isActive = user?.role === r;
            return (
              <button
                key={r}
                onClick={() => switchDemoRole(r)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-300">
                {user.full_name ? user.full_name.charAt(0) : "U"}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">{user.full_name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
