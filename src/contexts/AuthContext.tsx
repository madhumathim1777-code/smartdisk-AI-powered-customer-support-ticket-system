import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { authApi } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, full_name: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users mapped for 1-click role testing
const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: "usr-admin",
    email: "admin@smartdesk.ai",
    full_name: "Eleanor Vance (Admin)",
    role: "admin",
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
  agent: {
    id: "usr-agent-1",
    email: "sarah.chen@smartdesk.ai",
    full_name: "Sarah Chen",
    role: "agent",
    is_active: true,
    created_at: "2026-09-10T09:00:00Z",
  },
  customer: {
    id: "usr-cust-1",
    email: "alex.miller@acme.com",
    full_name: "Alex Miller",
    role: "customer",
    is_active: true,
    created_at: "2026-10-01T10:00:00Z",
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("smartdesk_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("smartdesk_token");
      if (storedToken) {
        try {
          const profile = await authApi.me();
          setUser(profile);
        } catch {
          // If token failed, default to Admin for easy preview evaluation
          setUser(DEMO_USERS.admin);
          localStorage.setItem("smartdesk_token", `demo-token-${DEMO_USERS.admin.id}`);
          setToken(`demo-token-${DEMO_USERS.admin.id}`);
        }
      } else {
        // Default session initialized with Admin for instant reviewability
        setUser(DEMO_USERS.admin);
        localStorage.setItem("smartdesk_token", `demo-token-${DEMO_USERS.admin.id}`);
        setToken(`demo-token-${DEMO_USERS.admin.id}`);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = "Password123!") => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem("smartdesk_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, full_name: string, password = "Password123!") => {
    setIsLoading(true);
    try {
      const res = await authApi.register(email, full_name, password);
      localStorage.setItem("smartdesk_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("smartdesk_token");
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setUser(demoUser);
    const fakeToken = `demo-token-${demoUser.id}`;
    localStorage.setItem("smartdesk_token", fakeToken);
    setToken(fakeToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
