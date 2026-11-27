/**
 * Provider-agnostic chat LLM for the bridge (GTM captions, etc.).
 *
 * Env:
 *   LLM_PROVIDER     openrouter | openai_compatible | stub  (default: stub if no key)
 *   OPENROUTER_API_KEY / LLM_API_KEY
 *   OPENROUTER_MODEL / LLM_MODEL   default baidu/ernie-5.5-flash-preview:free
 *   LLM_BASE_URL     override API base (default OpenRouter)
 *   LLM_SITE_URL / LLM_APP_NAME    optional OpenRouter rankings headers
 *
 * Always keep the deterministic stub path in gtm-prompts.js — this module is
 * only invoked when a caller explicitly requests a live model run.
 */

const DEFAULT_OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "baidu/ernie-5.5-flash-preview:free";

export function getLlmConfig() {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.LLM_API_KEY ||
    "";
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase().trim();
  let provider = explicit;
  if (!provider) {
    provider = apiKey ? "openrouter" : "stub";
  }
  const model =
    process.env.OPENROUTER_MODEL ||
    process.env.LLM_MODEL ||
    DEFAULT_MODEL;
  const baseUrl = (
    process.env.LLM_BASE_URL ||
    (provider === "openrouter" ? DEFAULT_OPENROUTER_BASE : DEFAULT_OPENROUTER_BASE)
  ).replace(/\/$/, "");
  return {
    provider,
    configured: Boolean(apiKey) && provider !== "stub",
    apiKey: apiKey || null,
    model,
    baseUrl,
  };
}

/**
 * Non-streaming chat completion. Returns { content, model, provider, usage? }.
 */
export async function chatComplete({
  messages,
  model,
  temperature = 0.4,
  maxTokens = 2048,
} = {}) {
  const cfg = getLlmConfig();
  if (!cfg.configured) {
    const err = new Error(
      "LLM not configured — set OPENROUTER_API_KEY (or LLM_API_KEY) and LLM_PROVIDER≠stub",
    );
    err.code = "LLM_NOT_CONFIGURED";
    throw err;
  }

  const body = {
    model: model || cfg.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${cfg.apiKey}`,
  };
  if (cfg.provider === "openrouter") {
    if (process.env.LLM_SITE_URL) headers["HTTP-Referer"] = process.env.LLM_SITE_URL;
    headers["X-Title"] = process.env.LLM_APP_NAME || "zeta-notebooklm-social-bridge";
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      data.error?.message || data.message || `LLM HTTP ${res.status}`,
    );
    err.code = "LLM_HTTP_ERROR";
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const content = data.choices?.[0]?.message?.content || "";
  return {
    content,
    model: data.model || body.model,
    provider: cfg.provider,
    usage: data.usage || null,
  };
}

/** Try to parse a JSON object from an LLM reply (strip fences if needed). */
export function parseJsonContent(content) {
  if (!content || typeof content !== "string") return null;
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      return null;
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}
