type ApiError = Error & { status?: number };

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return base.replace(/\/$/, "");
}

function backendBaseFromApiBase(api: string): string {
  // Default repo config uses NEXT_PUBLIC_API_URL=http://localhost:8000/api
  // Sanctum CSRF cookie lives at /sanctum/csrf-cookie (not /api/*).
  return api.replace(/\/api$/, "");
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const parts = document.cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (!part.startsWith(needle)) continue;
    return decodeURIComponent(part.slice(needle.length));
  }
  return null;
}

let csrfReady = false;

export async function ensureCsrfCookie(): Promise<void> {
  if (csrfReady) return;
  const api = apiBase();
  const backend = backendBaseFromApiBase(api);
  await fetch(`${backend}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
  csrfReady = true;
}

function withXsrf(headers: Headers): void {
  const token = readCookie("XSRF-TOKEN");
  if (token) headers.set("X-XSRF-TOKEN", token);
  headers.set("X-Requested-With", "XMLHttpRequest");
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (init.method && init.method.toUpperCase() !== "GET") {
    withXsrf(headers);
  }

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers, credentials: "include" });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && (body as any).message) ||
      (typeof body === "string" ? body : `Request failed (${res.status})`);
    const err = new Error(message) as ApiError;
    err.status = res.status;
    throw err;
  }

  return body;
}

