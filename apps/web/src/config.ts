export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function joinUrl(roomId: string): string {
  const base = window.location.origin;
  return `${base}/j/${roomId}`;
}
