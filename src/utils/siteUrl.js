// Resolve the base site URL consistently across dev, preview, and prod.
// Priority:
// 1) NEXT_PUBLIC_SITE_URL (set on Vercel to your canonical domain)
// 2) VERCEL_URL (provided by Vercel, add https:// prefix)
// 3) window.location.origin (client only)
// 4) fallback to http://localhost:3000

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
