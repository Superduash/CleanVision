/**
 * Administrative API service for Single-Hospital Deployment.
 * Handles Manager and Inspector account creation with assigned blocks.
 * Role authority and custom claims are assigned server-side.
 */

import { api, StaffUser } from "./api";

export type RoleType = "admin" | "manager" | "inspector";

export async function createManager(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<void> {
  await api.createManager(input);
}

export async function createInspector(input: {
  email: string;
  password: string;
  name?: string;
  assignedBlocks?: string[];
}): Promise<void> {
  await api.createInspector(input);
}

export async function listStaff(): Promise<StaffUser[]> {
  const res = await api.listStaff();
  return res.staff;
}
