import { toast } from "sonner";
import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type RoomStatus = "clean" | "needs_attention" | "dirty";

export interface Room {
  id: string | number;
  name: string;
  block: string;
  roomCode?: string;
  floor?: string;
  roomNumber?: string;
  baseline_image_path: string | null;
  latest_score: number | null;
  latest_status: RoomStatus | null;
  last_scanned: string | null;
  created_at: string;
}

export interface RoomDetail {
  id: string | number;
  name: string;
  block: string;
  roomCode?: string;
  floor?: string;
  roomNumber?: string;
  baseline_image_path: string | null;
  latest_score?: number | null;
  latest_status?: RoomStatus | null;
  last_scanned?: string | null;
  created_at: string;
}

export interface ScanRecord {
  id: string | number;
  room_id: string | number;
  image_path: string | null;
  cleanliness_score: number;
  status: RoomStatus;
  timestamp: string;
}

export interface ScanResult {
  scan_id: string | number;
  score: number;
  status: RoomStatus;
  room_id: string | number;
  image_path: string;
  mock: boolean;
}

export interface ReportsSummary {
  today_count: number;
  avg_score_today: number;
  status_counts: {
    clean: number;
    needs_attention: number;
    dirty: number;
  };
  daily_trend: Array<{
    date: string;
    avg_score: number;
    scan_count: number;
  }>;
  block_breakdown: Array<{
    block: string;
    room_count: number;
    avg_score: number | null;
    attention_count: number;
  }>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  roomId?: string | null;
  is_read: boolean;
  createdAt: string;
}

export interface RoomLookup {
  roomCode: string;
  roomId: string;
  block: string;
  floor: string;
  roomNumber: string;
  hospitalName: string;
}

export interface IssueReport {
  id: string;
  roomCode: string;
  roomId: string;
  block: string;
  roomName?: string;
  issueType: string;
  comment?: string | null;
  photoUrl?: string | null;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}

export interface StaffUser {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "inspector";
  assignedBlocks?: string[];
  createdAt: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const COLD_START_NOTICE_MS = 5_000;

async function getAuthHeader(): Promise<Record<string, string>> {
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  }
  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const coldStartTimer = setTimeout(() => {
    toast.message("Waking up the server…", {
      description:
        "The backend was idle and is starting back up. This can take up to a minute.",
      duration: 10_000,
      id: "cold-start",
    });
  }, COLD_START_NOTICE_MS);

  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...authHeaders,
        ...init?.headers,
      },
    });

    clearTimeout(coldStartTimer);
    toast.dismiss("cold-start");

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {}
      throw new ApiError(message, res.status);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(coldStartTimer);
    toast.dismiss("cold-start");
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
    );
  }
}

export const api = {
  health: () => request<{ status: string; mock_mode?: boolean }>("/api/health"),

  // Hospital Config
  getHospitalConfig: () => request<{ config: any }>("/api/hospital/config"),
  updateHospitalConfig: (config: any) =>
    request<{ success: boolean }>("/api/hospital/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),

  // Rooms
  listRooms: (block?: string) =>
    request<{ rooms: Room[] }>(block ? `/api/rooms?block=${block}` : "/api/rooms"),

  getRoom: (roomId: string | number) =>
    request<{ room: RoomDetail }>(`/api/rooms/${roomId}`),

  createRoom: (input: { name: string; block: string; floor?: string; roomNumber?: string }) => {
    const form = new FormData();
    form.append("name", input.name);
    form.append("block", input.block);
    if (input.floor) form.append("floor", input.floor);
    if (input.roomNumber) form.append("roomNumber", input.roomNumber);
    return request<{ success: boolean; room_id: string; room_code: string }>("/api/rooms", {
      method: "POST",
      body: form,
    });
  },

  updateRoom: (roomId: string | number, input: { name: string; block: string; floor?: string; roomNumber?: string }) => {
    const form = new FormData();
    form.append("name", input.name);
    form.append("block", input.block);
    if (input.floor) form.append("floor", input.floor);
    if (input.roomNumber) form.append("roomNumber", input.roomNumber);
    return request<{ success: boolean }>(`/api/rooms/${roomId}`, {
      method: "PATCH",
      body: form,
    });
  },

  deleteRoom: (roomId: string | number) =>
    request<void>(`/api/rooms/${roomId}`, { method: "DELETE" }),

  uploadBaseline: (roomId: string | number, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return request<{ success: boolean; image_path: string }>(
      `/api/rooms/${roomId}/baseline`,
      { method: "POST", body: form },
    );
  },

  scanRoom: (roomId: string | number, image: File) => {
    const form = new FormData();
    form.append("room_id", String(roomId));
    form.append("image", image);
    return request<ScanResult>("/api/scan", { method: "POST", body: form });
  },

  getHistory: (roomId: string | number, limit = 50) =>
    request<{ history: ScanRecord[] }>(
      `/api/rooms/${roomId}/history?limit=${limit}`,
    ),

  deleteScan: (scanId: string | number) =>
    request<void>(`/api/scans/${scanId}`, { method: "DELETE" }),

  getSummary: () => request<ReportsSummary>("/api/reports/summary"),

  getReports: (days = 7) =>
    request<ReportsSummary>(`/api/reports/summary?days=${days}`),

  // Public QR Room Lookup
  getRoomLookup: (roomCode: string) =>
    request<{ roomLookup: RoomLookup }>(`/api/report/lookup/${roomCode}`),

  // Public Issue Reports (Unauthenticated patient/visitor submission)
  submitIssueReport: (input: {
    roomCode: string;
    issueType: string;
    comment?: string;
    photo?: File;
  }) => {
    const form = new FormData();
    form.append("room_code", input.roomCode);
    form.append("issue_type", input.issueType);
    if (input.comment) form.append("comment", input.comment);
    if (input.photo) form.append("photo", input.photo);
    return request<{ success: boolean; report_id: string }>("/api/report/submit", {
      method: "POST",
      body: form,
    });
  },

  getIssueReports: (status?: string, block?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (block) params.set("block", block);
    const q = params.toString();
    return request<{ reports: IssueReport[]; open_count: number }>(
      q ? `/api/reports/issues?${q}` : "/api/reports/issues",
    );
  },

  updateIssueReportStatus: (reportId: string, status: string) => {
    const form = new FormData();
    form.append("status", status);
    return request<{ success: boolean }>(`/api/reports/issues/${reportId}`, {
      method: "PATCH",
      body: form,
    });
  },

  // Notifications
  getNotifications: (limit = 50) =>
    request<{ notifications: Notification[]; unread_count: number }>(
      `/api/notifications?limit=${limit}`,
    ),

  markNotificationRead: (id: string | number) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>("/api/notifications/mark-all-read", {
      method: "POST",
    }),

  deleteNotification: (id: string | number) =>
    request<void>(`/api/notifications/${id}`, { method: "DELETE" }),

  // Staff Management (Admin / Manager)
  getAdminStats: () =>
    request<{
      total_rooms: number;
      total_scans: number;
      pending_requests: number;
      open_issues: number;
      unread_notifications: number;
      mock_mode: boolean;
    }>("/api/admin/stats"),

  createManager: (input: { email: string; password: string; name?: string }) =>
    request<{ success: boolean; uid: string; email: string; role: string }>(
      "/api/admin/managers",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),

  createInspector: (input: { email: string; password: string; name?: string; assignedBlocks?: string[] }) =>
    request<{ success: boolean; uid: string; email: string; role: string; assignedBlocks: string[] }>(
      "/api/manager/inspectors",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),

  listStaff: () =>
    request<{ staff: StaffUser[] }>("/api/admin/staff"),
};

export const STATUS_LABEL: Record<RoomStatus, string> = {
  clean: "Clean",
  needs_attention: "Needs attention",
  dirty: "Dirty",
};

export function imageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}/${path}`;
}
