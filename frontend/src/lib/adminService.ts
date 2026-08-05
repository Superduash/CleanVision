/**
 * Firestore admin role management service.
 *
 * Admins are stored in Firestore `admins` collection as documents keyed by email.
 * Super-admin: aashwinsuperdu@gmail.com — always admin, cannot be revoked.
 *
 * Firestore document shape:
 *   admins/{email} → { email, grantedBy, grantedAt }
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const SUPER_ADMIN_EMAIL = "admin@cleanvision.com";

export interface AdminRecord {
  email: string;
  grantedBy: string;
  grantedAt: Date | null;
  isSuperAdmin: boolean;
}

/** Check if a given email has admin privileges. */
export async function isAdminEmail(email: string): Promise<boolean> {
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
  try {
    const ref = doc(db, "admins", email.toLowerCase());
    const snap = await getDoc(ref);
    return snap.exists();
  } catch {
    // If Firestore is unreachable, only super-admin gets through
    return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
}

/** Fetch all admin records from Firestore. */
export async function getAllAdmins(): Promise<AdminRecord[]> {
  let results: AdminRecord[] = [];
  try {
    const snap = await getDocs(collection(db, "admins"));
    results = snap.docs.map((d) => {
      const data = d.data();
      return {
        email: d.id,
        grantedBy: data.grantedBy ?? "system",
        grantedAt: data.grantedAt?.toDate?.() ?? null,
        isSuperAdmin: d.id.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
      };
    });
  } catch {
    // Fallback if Firestore is unconfigured or offline
  }

  // Ensure super-admin is always in the list even if not in Firestore
  const hasSuperAdmin = results.some(
    (r) => r.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
  if (!hasSuperAdmin) {
    results.unshift({
      email: SUPER_ADMIN_EMAIL,
      grantedBy: "system",
      grantedAt: null,
      isSuperAdmin: true,
    });
  }

  // Super-admin always first
  return results.sort((a, b) => (a.isSuperAdmin ? -1 : b.isSuperAdmin ? 1 : 0));
}

/** Grant admin role to an email. Can only be called by existing admins. */
export async function grantAdmin(email: string, grantedBy: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) throw new Error("Email is required");
  await setDoc(doc(db, "admins", normalized), {
    email: normalized,
    grantedBy,
    grantedAt: serverTimestamp(),
  });
}

/** Revoke admin role. Super-admin cannot be revoked. */
export async function revokeAdmin(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  if (normalized === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Super admin cannot be revoked.");
  }
  await deleteDoc(doc(db, "admins", normalized));
}
