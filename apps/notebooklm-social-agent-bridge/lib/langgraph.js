/**
 * Minimal LangGraph HTTP client (no SDK dependency).
 * Talks to @langchain/langgraph-cli (dev/up) using graph names from langgraph.json.
 */

function baseUrl() {
  const raw =
    process.env.LANGGRAPH_API_URL ||
    process.env.LANGGRAPH_URL ||
    // langgraph-cli binds host=localhost (often ::1); prefer hostname over 127.0.0.1
    "http://localhost:54367";
  return raw.replace(/\/$/, "");
}

export function getLangGraphConfig() {
  return {
    apiUrl: baseUrl(),
    linkedInUserId:
      process.env.LINKEDIN_USER_ID || process.env.ARCADE_USER_ID || null,
    textOnly: process.env.TEXT_ONLY_MODE !== "false",
  };
}

async function request(path, { method = "GET", body } = {}) {
  const url = `${baseUrl()}${path}`;
  const started = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const error = new Error(
      `LangGraph unreachable at ${url}: ${err.message || err}`,
    );
    error.code = "LANGGRAPH_UNREACHABLE";
    error.cause = err;
    throw error;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const error = new Error(
      `LangGraph ${method} ${path} → ${res.status}: ${text.slice(0, 400)}`,
    );
    error.status = res.status;
    error.data = data;
    error.ms = Date.now() - started;
    throw error;
  }

  return { data, ms: Date.now() - started, status: res.status };
}

export async function healthCheck() {
  try {
    // Prefer assistants list; fall back to ok if anything answers
    const { data, ms } = await request("/assistants/search", {
      method: "POST",
      body: {},
    });
    const names = Array.isArray(data)
      ? data.map((a) => a.graph_id || a.assistant_id || a.name).filter(Boolean)
      : [];
    return {
      ok: true,
      apiUrl: baseUrl(),
      ms,
      assistants: names,
    };
  } catch (err) {
    return {
      ok: false,
      apiUrl: baseUrl(),
      error: err.message,
      code: err.code || err.status || null,
    };
  }
}

export async function createThread() {
  const { data } = await request("/threads", { method: "POST", body: {} });
  return data.thread_id;
}

export async function createAndJoinRun(threadId, graphId, input, configurable = {}) {
  const { data: run } = await request(`/threads/${threadId}/runs`, {
    method: "POST",
    body: {
      assistant_id: graphId,
      input,
      config: { configurable },
    },
  });

  const runId = run.run_id;
  const { data: joined } = await request(
    `/threads/${threadId}/runs/${runId}/join`,
    { method: "GET" },
  );

  let state = null;
  try {
    const s = await request(`/threads/${threadId}/state`, { method: "GET" });
    state = s.data;
  } catch {
    /* optional */
  }

  return { runId, joined, state };
}

export async function uploadPost(post, { wait = true } = {}) {
  const threadId = await createThread();
  const configurable = {};
  if (getLangGraphConfig().textOnly) {
    configurable.textOnlyMode = true;
  }

  if (!wait) {
    const { data: run } = await request(`/threads/${threadId}/runs`, {
      method: "POST",
      body: {
        assistant_id: "upload_post",
        input: { post, image: null },
        config: { configurable },
      },
    });
    return { threadId, runId: run.run_id, status: "started" };
  }

  const result = await createAndJoinRun(
    threadId,
    "upload_post",
    { post, image: null },
    configurable,
  );
  return { threadId, ...result };
}
