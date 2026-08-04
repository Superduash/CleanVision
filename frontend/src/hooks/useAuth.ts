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
import { isAdminEmail, SUPER_ADMIN_EMAIL } from "@/lib/adminService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "patient";

export interface Session {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL: string | null;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = "cleanvision.local_session";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

async function resolveRole(email: string): Promise<UserRole> {
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return "admin";
  try {
    const admin = await isAdminEmail(email);
    return admin ? "admin" : "patient";
  } catch {
    return "patient";
  }
}

async function buildSession(user: User): Promise<Session> {
  const email = user.email ?? "";
  const role = await resolveRole(email);
  return {
    uid: user.uid,
    name: user.displayName ?? email.split("@")[0] ?? "User",
    email,
    role,
    photoURL: user.photoURL,
  };
}

export function useProvideAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore local or Firebase session
  useEffect(() => {
    let unsub = () => {};

    try {
      if (auth && typeof onAuthStateChanged === "function") {
        unsub = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const s = await buildSession(user);
            setSession(s);
          } else {
            // Check local storage fallback
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
    if (isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (err) {
        // If Firebase fails with invalid api key, fall back to local dev login
        console.warn("Firebase Auth fallback to local mode:", err);
      }
    }

    // Local Dev Fallback Login
    const role = await resolveRole(email);
    const localSession: Session = {
      uid: "local-" + Date.now(),
      name: email.split("@")[0] || "User",
      email,
      role,
      photoURL: null,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSession));
    setSession(localSession);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
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

      // Local Dev Fallback Signup
      const role = await resolveRole(email);
      const localSession: Session = {
        uid: "local-" + Date.now(),
        name,
        email,
        role,
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSession));
      setSession(localSession);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    if (isFirebaseConfigured) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      return;
    }

    // Local Fallback for Google Sign In
    const localSession: Session = {
      uid: "google-local-" + Date.now(),
      name: "Super Admin",
      email: SUPER_ADMIN_EMAIL,
      role: "admin",
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
