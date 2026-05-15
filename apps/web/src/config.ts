export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function joinUrl(roomId: string, pin?: string | null): string {
  const base = window.location.origin;
  const cleaned = pin?.replace(/\D/g, "") ?? "";
  const qs = cleaned ? `?pin=${cleaned}` : "";
  return `${base}/j/${roomId}${qs}`;
}
