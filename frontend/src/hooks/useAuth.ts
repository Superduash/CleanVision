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
import { auth } from "@/lib/firebase";
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

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ─────────────────────────────────────────────────────────────────────────────
// Role resolution helper
// ─────────────────────────────────────────────────────────────────────────────

async function resolveRole(user: User): Promise<UserRole> {
  const email = user.email ?? "";
  // Super-admin always gets admin role immediately (no Firestore lookup)
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return "admin";
  // Check Firestore admins collection
  try {
    const admin = await isAdminEmail(email);
    return admin ? "admin" : "patient";
  } catch {
    return "patient";
  }
}

async function buildSession(user: User): Promise<Session> {
  const role = await resolveRole(user);
  return {
    uid: user.uid,
    name: user.displayName ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    role,
    photoURL: user.photoURL,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProvideAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const s = await buildSession(user);
        setSession(s);
      } else {
        setSession(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged fires and sets session automatically
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Refresh session with display name
      const s = await buildSession(cred.user);
      setSession(s);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setSession(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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

// ─────────────────────────────────────────────────────────────────────────────
// Consumer hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext.Provider");
  return ctx;
}
