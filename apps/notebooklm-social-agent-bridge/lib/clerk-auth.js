/**
 * Optional Clerk session verification for the bridge (OPEN-1).
 * Zero npm deps — verifies session JWTs via Clerk JWKS + Web Crypto.
 *
 * Env:
 *   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (required to enable)
 *   CLERK_SECRET_KEY                   (required to enable; also used as presence gate)
 *   CLERK_AUTHORIZED_PARTIES           optional comma list of origins (e.g. http://localhost:4317)
 */

function b64urlToBuf(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from((s + pad).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function getClerkConfig() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    "";
  const secretKey = process.env.CLERK_SECRET_KEY || "";
  const enabled = Boolean(publishableKey && secretKey);
  let frontendApi = null;
  if (publishableKey.startsWith("pk_")) {
    try {
      const raw = publishableKey.replace(/^pk_(test|live)_/, "");
      frontendApi = Buffer.from(raw, "base64")
        .toString("utf8")
        .replace(/\$$/, "")
        .trim();
    } catch {
      frontendApi = null;
    }
  }
  return {
    enabled,
    publishableKey: enabled ? publishableKey : null,
    frontendApi,
    jwksUrl: frontendApi
      ? `https://${frontendApi}/.well-known/jwks.json`
      : null,
  };
}

let jwksCache = { at: 0, keys: null };

async function loadJwks(jwksUrl) {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.at < 60 * 60 * 1000) {
    return jwksCache.keys;
  }
  const res = await fetch(jwksUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Clerk JWKS HTTP ${res.status}`);
  const data = await res.json();
  jwksCache = { at: now, keys: data.keys || [] };
  return jwksCache.keys;
}

async function importPublicKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

/**
 * Verify a Clerk session JWT. Returns { ok, userId, sessionId, claims } or { ok:false, error }.
 */
export async function verifyClerkToken(token) {
  const cfg = getClerkConfig();
  if (!cfg.enabled || !cfg.jwksUrl) {
    return { ok: false, error: "clerk_disabled" };
  }
  if (!token || typeof token !== "string") {
    return { ok: false, error: "missing_token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, error: "malformed_jwt" };

  let header;
  let payload;
  try {
    header = JSON.parse(b64urlToBuf(parts[0]).toString("utf8"));
    payload = JSON.parse(b64urlToBuf(parts[1]).toString("utf8"));
  } catch {
    return { ok: false, error: "malformed_jwt" };
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { ok: false, error: "token_expired" };
  }

  const keys = await loadJwks(cfg.jwksUrl);
  const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
  if (!jwk) return { ok: false, error: "no_jwks_key" };

  const key = await importPublicKey(jwk);
  const data = Buffer.from(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToBuf(parts[2]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    sig,
    data,
  );
  if (!valid) return { ok: false, error: "bad_signature" };

  // Optional azp / authorized parties check
  const parties = (process.env.CLERK_AUTHORIZED_PARTIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parties.length && payload.azp && !parties.includes(payload.azp)) {
    return { ok: false, error: "unauthorized_party" };
  }

  return {
    ok: true,
    userId: payload.sub || null,
    sessionId: payload.sid || null,
    claims: payload,
  };
}

/** Extract Bearer token from Authorization header. */
export function bearerFromRequest(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
