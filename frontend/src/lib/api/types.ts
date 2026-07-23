/* ============================================================================
   CleanVision API Types
   Exact TypeScript interfaces matching the backend contract (UIPrompt.md §1).
   ============================================================================ */

export type Status = 'clean' | 'needs_attention' | 'dirty';

export interface Room {
  id: number;
  name: string;
  block: string;
  baseline_image_path: string | null;
  created_at: string;
  /** Only present on GET /api/rooms (list endpoint) */
  latest_score?: number | null;
  latest_status?: Status | null;
  last_scanned?: string | null;
}

export interface Scan {
  id: number;
  room_id: number;
  image_path: string;
  cleanliness_score: number;
  status: Status;
  timestamp: string;
}

export interface ScanResponse {
  scan_id: number;
  score: number;
  status: Status;
  room_id: number;
  image_path: string;
  mock: boolean;
}

export interface HealthResponse {
  status: string;
  mock_mode: boolean;
}

export interface ReportsSummary {
  today_count: number;
  avg_score_today: number;
  status_counts: { clean: number; needs_attention: number; dirty: number };
  daily_trend: { date: string; avg_score: number; scan_count: number }[];
  block_breakdown: {
    block: string;
    room_count: number;
    avg_score: number | null;
    attention_count: number;
  }[];
}

export interface CreateRoomResponse {
  success: boolean;
  room_id: number;
}

export interface BaselineUploadResponse {
  success: boolean;
  image_path: string;
}

export interface ApiErrorResponse {
  error: string;
}
