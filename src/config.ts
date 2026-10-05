/**
 * Runtime integration points for the landing page. Every value can be
 * overridden with a PUBLIC_* environment variable (see .env.example).
 */
const env = import.meta.env;

export const siteConfig = {
  /** Web application login screen. */
  webAppUrl: env.PUBLIC_WEBAPP_URL || "/login",
  /** Endpoint that receives demo requests as JSON (POST). */
  demoEndpoint: env.PUBLIC_DEMO_ENDPOINT || "",
  /** JSON status endpoint (Statuspage `status.json` or `{ "status": "operational" }`). */
  statusEndpoint: env.PUBLIC_STATUS_ENDPOINT || "",
  statusPageUrl: env.PUBLIC_STATUS_PAGE_URL || "/status",
  docsUrl: env.PUBLIC_DOCS_URL || "/docs",
  privacyUrl: env.PUBLIC_PRIVACY_URL || "/privacy",
  termsUrl: env.PUBLIC_TERMS_URL || "/terms",
  /** 24/7 technical line in E.164 format, e.g. +51987654321. Hidden when empty. */
  supportPhone: env.PUBLIC_SUPPORT_PHONE || "",
  /** Sales inbox. Hidden when empty. */
  salesEmail: env.PUBLIC_SALES_EMAIL || "",
} as const;

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
