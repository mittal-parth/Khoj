/**
 * CORS allowlist utilities.
 *
 * We intentionally validate browser-originated requests via the `Origin` header.
 * Server-to-server calls typically do not send `Origin`, so we allow those by default.
 *
 * Configuration:
 * - CORS_ALLOWED_ORIGINS: comma-separated list of allowed origins and wildcard patterns.
 *
 * Supported entries:
 * - Exact origins: "https://example.com", "http://localhost:5173"
 * - Wildcard subdomains: "https://*.khoj-alpha.netlify.app"
 *
 * Notes:
 * - Browsers do NOT include URL paths in the Origin header. However, we defensively
 *   handle origins with paths by normalizing to URL.origin.
 */

function splitCommaList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeOriginLike(value) {
  if (!value) return null;
  if (value === "null") return "null";

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function parseWildcardPattern(pattern) {
  // Supported:
  // - "https://*.example.com" (dot-separated subdomains only)
  // - "https://*example.com"  (any hostname suffix; supports Netlify deploy-preview style)
  const trimmed = pattern.trim();
  const idx = trimmed.indexOf("://");
  if (idx === -1) return null;

  const protocol = trimmed.slice(0, idx + 1); // "https:" or "http:"
  const hostAndMaybePath = trimmed.slice(idx + 3);

  // Do not allow paths/query/fragments in patterns.
  const host = hostAndMaybePath.split("/")[0].split("?")[0].split("#")[0];
  if (!host.startsWith("*")) return null;

  const isDotSubdomain = host.startsWith("*.");
  const baseHost = isDotSubdomain ? host.slice(2) : host.slice(1);
  if (!baseHost) return null;

  return { protocol, baseHost, mode: isDotSubdomain ? "dot-subdomain" : "suffix" };
}

/**
 * Returns true if the given origin is allowed by the provided patterns.
 *
 * @param {string | undefined | null} origin
 * @param {string[]} allowedPatterns
 */
export function isOriginAllowed(origin, allowedPatterns) {
  // Non-browser requests often omit Origin; CORS is not applicable there.
  if (!origin) return true;

  if (!Array.isArray(allowedPatterns) || allowedPatterns.length === 0) {
    return false;
  }

  if (origin === "null") {
    return allowedPatterns.includes("null");
  }

  let url;
  try {
    url = new URL(origin);
  } catch {
    // If the origin isn't parseable, fail closed.
    return false;
  }

  const requestOrigin = url.origin; // strips any path defensively
  const requestProtocol = url.protocol; // "https:" / "http:"
  const requestHost = url.host; // includes port if present
  const requestHostname = url.hostname; // no port

  for (const rawPattern of allowedPatterns) {
    const pattern = String(rawPattern || "").trim();
    if (!pattern) continue;

    if (pattern === "*") return true;

    // Exact origin match (normalized).
    const normalized = normalizeOriginLike(pattern);
    if (normalized && normalized === requestOrigin) return true;

    // Wildcard subdomain pattern match.
    const wildcard = parseWildcardPattern(pattern);
    if (wildcard) {
      if (wildcard.protocol !== requestProtocol) continue;

      if (wildcard.mode === "dot-subdomain") {
        // Match any dot-separated subdomain of baseHost (but not the apex itself).
        // Example: "*.example.com" matches "foo.example.com" but not "example.com"
        if (requestHostname.endsWith(`.${wildcard.baseHost}`)) return true;
      } else {
        // Match any hostname suffix (supports Netlify deploy-preview style like
        // "deploy-preview-219--khoj-alpha.netlify.app").
        if (requestHostname.endsWith(wildcard.baseHost)) return true;
      }
    }

    // Allow explicit host:port entries if someone configures them without scheme
    // (not recommended, but makes local config easier).
    if (pattern === requestHost) return true;
  }

  return false;
}

export function getAllowedCorsOriginsFromEnv(env = process.env) {
  return splitCommaList(env.CORS_ALLOWED_ORIGINS);
}

export function createCorsOptionsFromEnv(env = process.env) {
  const allowedOrigins = getAllowedCorsOriginsFromEnv(env);

  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked: origin not allowed (${origin || "no-origin"})`
        ),
        false
      );
    },
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    preflightContinue: false,
  };
}

