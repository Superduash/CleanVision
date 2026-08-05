import { formatDistanceToNow, format as formatFn } from "date-fns";

/**
 * Safely format distance to now without throwing RangeError on invalid dates.
 */
export function safeFormatDistanceToNow(
  dateStr: string | number | Date | null | undefined,
  options?: { addSuffix?: boolean }
): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, options);
  } catch {
    return "";
  }
}

/**
 * Safely format a date string using date-fns format template.
 */
export function safeFormatDate(
  dateStr: string | number | Date | null | undefined,
  formatPattern: string,
  fallback = "—"
): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return formatFn(d, formatPattern);
  } catch {
    return fallback;
  }
}
