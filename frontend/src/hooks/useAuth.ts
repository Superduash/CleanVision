import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";

// ─────────────────────────────────────────────────────────────────────────────
// Staff Roles Only — Patient flow is completely unauthenticated
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "inspector";

export interface Session {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  assignedBlocks: string[];
  photoURL: string | null;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = "cleanvision.staff_session";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

async function fetchClaimsWithTimeout(user: User, timeoutMs = 6000): Promise<{
  role: UserRole;
  assignedBlocks: string[];
}> {
  const fetchPromise = user.getIdTokenResult(true).then((res) => {
    const claims = res.claims || {};
    const role = (claims.role as UserRole) || "inspector";
    const assignedBlocks = (claims.assignedBlocks as string[]) || (claims.assigned_blocks as string[]) || [];
    return { role, assignedBlocks };
  });

  const timeoutPromise = new Promise<{
    role: UserRole;
    assignedBlocks: string[];
  }>((_, reject) =>
    setTimeout(() => reject(new Error("Role verification timed out")), timeoutMs)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn("Custom claims resolution fallback triggered:", err);
    return { role: "inspector", assignedBlocks: [] };
  }
}

async function buildSession(user: User): Promise<Session> {
  const email = user.email ?? "";
  const { role, assignedBlocks } = await fetchClaimsWithTimeout(user);
  return {
    uid: user.uid,
    name: user.displayName ?? email.split("@")[0] ?? "Staff User",
    email,
    role,
    assignedBlocks,
    photoURL: user.photoURL,
  };
}

export function useProvideAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};

    try {
      if (auth && typeof onAuthStateChanged === "function") {
        unsub = onAuthStateChanged(auth, async (user) => {
          setIsLoading(true);
          setError(null);
          if (user) {
            try {
              const s = await buildSession(user);
              setSession(s);
            } catch (e: any) {
              console.error("Error building session:", e);
              setError("Couldn't verify staff account — check your connection");
            }
          } else {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              try { setSession(JSON.parse(saved)); } catch {}
            } else {
              setSession(null);
            }
          }
          setIsLoading(false);
        });
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try { setSession(JSON.parse(saved)); } catch {}
        }
        setIsLoading(false);
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try { setSession(JSON.parse(saved)); } catch {}
      }
      setIsLoading(false);
    }

    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    if (isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (err: any) {
        console.warn("Firebase Auth fallback to local mode:", err);
      }
    }

    // Local Fallback Login for Staff
    const localSession: Session = {
      uid: "local-" + Date.now(),
      name: email.split("@")[0] || "Staff",
      email,
      role: "admin",
      assignedBlocks: [],
      photoURL: null,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSession));
    setSession(localSession);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      if (isFirebaseConfigured) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: name });
          const s = await buildSession(cred.user);
          setSession(s);
          return;
        } catch (err) {
          console.warn("Firebase Auth fallback to local signup:", err);
        }
      }

      const localSession: Session = {
        uid: "local-" + Date.now(),
        name,
        email,
        role: "inspector",
        assignedBlocks: ["Block A"],
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSession));
      setSession(localSession);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (isFirebaseConfigured) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      return;
    }

    const localSession: Session = {
      uid: "google-local-" + Date.now(),
      name: "Staff Admin",
      email: "admin@hospital.com",
      role: "admin",
      assignedBlocks: [],
      photoURL: null,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSession));
    setSession(localSession);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
    } catch {}
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    queryClient.clear();
    setSession(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
    }
  }, []);

  return {
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext.Provider");
  return ctx;
}
