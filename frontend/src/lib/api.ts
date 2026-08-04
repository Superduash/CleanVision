import { toast } from "sonner";

/**
 * Base URL for the Flask backend.
 * - Local dev: left empty, requests go through the Vite proxy in vite.config.ts.
 * - Production: set VITE_API_BASE_URL to the deployed Render URL,
 *   e.g. https://cleanvision-api.onrender.com
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type RoomStatus = "clean" | "needs_attention" | "dirty";

export interface Room {
  id: number;
  name: string;
  block: string;
  baseline_image_path: string | null;
  /** Only present on GET /api/rooms (list), via the LEFT JOIN */
  latest_score: number | null;
  latest_status: RoomStatus | null;
  last_scanned: string | null;
  created_at: string;
}

/**
 * Single room from GET /api/rooms/:id — raw db row (no join).
 * Field names match database.py `get_room()`.
 */
export interface RoomDetail {
  id: number;
  name: string;
  block: string;
  baseline_image_path: string | null;
  created_at: string;
}

/** One row from GET /api/rooms/:id/history — matches database.py `get_scan_history()`. */
export interface ScanRecord {
  id: number;
  room_id: number;
  image_path: string | null;
  cleanliness_score: number;
  status: RoomStatus;
  timestamp: string;
}

/** Response from POST /api/scan */
export interface ScanResult {
  scan_id: number;
  score: number;
  status: RoomStatus;
  room_id: number;
  image_path: string;
  mock: boolean;
}

/** Response from GET /api/reports/summary */
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

/** Legacy alias for the summary used on the dashboard */
export interface SummaryReport {
  total_rooms: number;
  clean_count: number;
  needs_attention_count: number;
  dirty_count: number;
  average_score: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Render's free tier spins the backend down after 15 minutes idle. The first
 * request after that can take 30-60s while the container boots and the model
 * loads. Anything still pending past this threshold gets a "waking up the
 * server" toast so it doesn't look frozen.
 */
const COLD_START_NOTICE_MS = 5_000;

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
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });

    clearTimeout(coldStartTimer);
    // Dismiss the cold-start toast if it appeared
    toast.dismiss("cold-start");

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // Not JSON — fall back to generic message
      }
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

/** One cleaning request record */
export interface CleaningRequest {
  id: number;
  room_id: number;
  room_name: string;
  room_block: string;
  requested_by_name: string;
  requested_by_email: string;
  reason: string;
  status: "pending" | "in_progress" | "completed" | "dismissed";
  created_at: string;
  resolved_at: string | null;
}

/** One notification record */
export interface Notification {
  id: number;
  type: "scan_result" | "cleaning_request" | "request_update";
  title: string;
  message: string;
  room_id: number | null;
  is_read: 0 | 1;
  created_at: string;
}

export const api = {
  health: () => request<{ status: string; mock_mode?: boolean }>("/api/health"),

  listRooms: () => request<{ rooms: Room[] }>("/api/rooms"),

  getRoom: (roomId: number) =>
    request<{ room: RoomDetail }>(`/api/rooms/${roomId}`),

  createRoom: (input: { name: string; block: string }) => {
    const form = new FormData();
    form.append("name", input.name);
    form.append("block", input.block);
    return request<{ success: boolean; room_id: number }>("/api/rooms", {
      method: "POST",
      body: form,
    });
  },

  updateRoom: (roomId: number, input: { name: string; block: string }) => {
    const form = new FormData();
    form.append("name", input.name);
    form.append("block", input.block);
    return request<{ success: boolean }>(`/api/rooms/${roomId}`, {
      method: "PATCH",
      body: form,
    });
  },

  deleteRoom: (roomId: number) =>
    request<void>(`/api/rooms/${roomId}`, { method: "DELETE" }),

  uploadBaseline: (roomId: number, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return request<{ success: boolean; image_path: string }>(
      `/api/rooms/${roomId}/baseline`,
      { method: "POST", body: form },
    );
  },

  scanRoom: (roomId: number, image: File) => {
    const form = new FormData();
    form.append("room_id", String(roomId));
    form.append("image", image);
    return request<ScanResult>("/api/scan", { method: "POST", body: form });
  },

  getHistory: (roomId: number, limit = 50) =>
    request<{ history: ScanRecord[] }>(
      `/api/rooms/${roomId}/history?limit=${limit}`,
    ),

  deleteScan: (scanId: number) =>
    request<void>(`/api/scans/${scanId}`, { method: "DELETE" }),

  getSummary: () => request<SummaryReport>("/api/reports/summary"),

  getReports: (days = 7) =>
    request<ReportsSummary>(`/api/reports/summary?days=${days}`),

  // ── Cleaning Requests ────────────────────────────────────────────
  createCleaningRequest: (input: {
    room_id: number;
    requested_by_name: string;
    requested_by_email: string;
    reason?: string;
  }) => {
    const form = new FormData();
    form.append("room_id", String(input.room_id));
    form.append("requested_by_name", input.requested_by_name);
    form.append("requested_by_email", input.requested_by_email);
    form.append("reason", input.reason ?? "");
    return request<{ success: boolean; request_id: number }>(
      "/api/cleaning-requests",
      { method: "POST", body: form },
    );
  },

  getCleaningRequests: (status?: string) =>
    request<{ requests: CleaningRequest[]; pending_count: number }>(
      status ? `/api/cleaning-requests?status=${status}` : "/api/cleaning-requests",
    ),

  updateCleaningRequest: (requestId: number, status: string) => {
    const form = new FormData();
    form.append("status", status);
    return request<{ success: boolean }>(
      `/api/cleaning-requests/${requestId}`,
      { method: "PATCH", body: form },
    );
  },

  getRoomCleaningRequests: (roomId: number) =>
    request<{ requests: CleaningRequest[] }>(
      `/api/rooms/${roomId}/cleaning-requests`,
    ),

  // ── Notifications ────────────────────────────────────────────────
  getNotifications: (limit = 50) =>
    request<{ notifications: Notification[]; unread_count: number }>(
      `/api/notifications?limit=${limit}`,
    ),

  markNotificationRead: (id: number) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>("/api/notifications/mark-all-read", {
      method: "POST",
    }),

  deleteNotification: (id: number) =>
    request<void>(`/api/notifications/${id}`, { method: "DELETE" }),

  // ── Admin ────────────────────────────────────────────────────────
  getAdminStats: () =>
    request<{
      total_rooms: number;
      total_scans: number;
      pending_requests: number;
      unread_notifications: number;
      mock_mode: boolean;
    }>("/api/admin/stats"),
};

export const STATUS_LABEL: Record<RoomStatus, string> = {
  clean: "Clean",
  needs_attention: "Needs attention",
  dirty: "Dirty",
};

/** Returns the image src for a backend-relative path, proxied in dev. */
export function imageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${API_BASE_URL}/${path}`;
}
