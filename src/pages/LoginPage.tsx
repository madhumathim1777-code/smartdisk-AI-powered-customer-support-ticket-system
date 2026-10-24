import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bot, Shield, User, Headphones, ArrowRight, Lock, Mail } from "lucide-react";
import { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const { login, register, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, fullName, password);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    switchDemoRole(role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Bot className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">SmartDesk AI</h2>
          <p className="mt-1 text-sm text-slate-400">Intelligent Support Ticket Management Platform</p>
        </div>

        {/* 1-Click Fast Demo Switcher */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-md">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 text-center">
            Instant Demo Account Access (1-Click)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo("admin")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 text-slate-200 transition group"
            >
              <Shield className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
              <span className="text-xs font-medium mt-1">Admin</span>
            </button>
            <button
              onClick={() => handleQuickDemo("agent")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 text-slate-200 transition group"
            >
              <Headphones className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <span className="text-xs font-medium mt-1">Agent</span>
            </button>
            <button
              onClick={() => handleQuickDemo("customer")}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 text-slate-200 transition group"
            >
              <User className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-xs font-medium mt-1">Customer</span>
            </button>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                !isRegister
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                isRegister
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Customer Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Miller"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              <span>{isRegister ? "Create Customer Account" : "Sign In to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
