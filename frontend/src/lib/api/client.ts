/* ============================================================================
   CleanVision API Client
   Typed fetch wrapper for all backend endpoints. Distinguishes network
   errors from API errors, reads the backend's {error} message directly.
   ============================================================================ */

import type { ApiErrorResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string || '';

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;

  constructor(message: string, status: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${String(response.status)}`;
    try {
      const body = (await response.json()) as ApiErrorResponse;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Response body wasn't JSON — use the generic message
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Couldn't reach the server — check your connection.",
      0,
      true,
    );
  }
}

export async function apiPostFormData<T>(
  path: string,
  body: FormData,
  signal?: AbortSignal,
): Promise<T> {
  try {
    // Don't set Content-Type — browser sets multipart boundary automatically
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body,
      signal,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Couldn't reach the server — check your connection.",
      0,
      true,
    );
  }
}

/** Build a full URL for uploaded images (baselines, scans) */
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/${path}`;
}
