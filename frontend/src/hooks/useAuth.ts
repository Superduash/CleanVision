import { createContext, useContext, useEffect, useState } from "react";

/**
 * LOCAL AUTH — the backend does not expose auth endpoints yet.
 * This stores a lightweight local session so Login/Signup and the protected
 * dashboard route are fully navigable and demoable.
 *
 * Two built-in demo accounts are pre-seeded:
 *   Patient / Staff   → demo@gmail.com  / demo
 *   Admin / QA Mgmt   → admin@gmail.com / admin
 *
 * When the backend adds real auth, replace `signIn`/`signUp` with actual
 * API calls and drop the localStorage session.
 */

export type UserRole = "admin" | "patient" | "user";

export interface Session {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const STORAGE_KEY = "cleanvision.session";

/** Pre-seeded demo accounts */
const DEMO_ACCOUNTS: Record<string, { password: string; name: string; role: UserRole }> = {
  "demo@gmail.com": {
    password: "demo",
    name: "Demo Patient",
    role: "patient",
  },
  "admin@gmail.com": {
    password: "admin",
    name: "Admin (QA Management)",
    role: "admin",
  },
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useProvideAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persist = (next: Session) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  };

  return {
    session,
    isLoading,

    signIn: async (email, password) => {
      await new Promise((r) => setTimeout(r, 350)); // simulate network latency

      const emailKey = email.toLowerCase().trim();
      const demo = DEMO_ACCOUNTS[emailKey];

      if (demo) {
        // Demo account — check password
        if (demo.password !== password) {
          throw new Error("Incorrect password. Try again.");
        }
        persist({ name: demo.name, email: emailKey, role: demo.role });
        return;
      }

      // Any other credentials create a regular session
      persist({ name: email.split("@")[0], email: emailKey, role: "user" });
    },

    signUp: async (name, email, _password) => {
      await new Promise((r) => setTimeout(r, 350));
      const emailKey = email.toLowerCase().trim();
      persist({ name, email: emailKey, role: "user" });
    },

    signOut: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    },
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext.Provider");
  return ctx;
}
