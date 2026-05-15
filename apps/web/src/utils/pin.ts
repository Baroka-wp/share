export function generateSessionPin(): string {
  const part = () =>
    String(Math.floor(100 + Math.random() * 900));
  return `${part()}-${part()}`;
}

export function pinForApi(formatted: string): string {
  return formatted.replace(/\D/g, "");
}
