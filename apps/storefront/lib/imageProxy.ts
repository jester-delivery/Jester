/**
 * URL pentru imagine prin proxy (același origin).
 * Folosim peste tot (listă produse + lightbox) ca imaginile să se încarce și pe IP local.
 */
export function getProxiedImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}
