"use client";

import { useEffect, useState, type SyntheticEvent } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "Pending" | "In Progress" | "Completed";
  user_id: number;
  created_at: string;
  updated_at: string;
};

type Me = {
  id: number;
  name: string;
  email: string;
};

const STATUSES: Task["status"][] = ["Pending", "In Progress", "Completed"];

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return base.replace(/\/$/, "");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && (body as any).message) ||
      (typeof body === "string" ? body : `Request failed (${res.status})`);
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("Pending");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [initializing, setInitializing] = useState(true);

  function restoreMeFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("me");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Me;
      if (parsed?.email) setMe(parsed);
    } catch {
      // ignore bad JSON
    }
  }

  async function load() {
    setError(null);
    const list = await apiFetch("/tasks");
    setTasks(list as Task[]);
  }

  useEffect(() => {
    // Try to load if token exists
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setHasToken(Boolean(token));

    if (!token) {
      setInitializing(false);
      return;
    }

    restoreMeFromStorage();

    load()
      .catch((e: any) => {
        // If the token is invalid/expired, clear it and show the login form again.
        if (e?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("me");
          setHasToken(false);
          setMe(null);
          setTasks([]);
          setError("Session expired. Please sign in again.");
          return;
        }

        setError(e?.message ?? "Failed to load session.");
      })
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = (await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })) as any;
      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify(data.user));
      setHasToken(true);
      setMe(data.user as Me);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("me");
      setHasToken(false);
      setMe(null);
      setTasks([]);
      setBusy(false);
    }
  }

  async function onCreateTask(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = (await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description: description || null, status }),
      })) as Task;
      setTasks((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setStatus("Pending");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateStatus(task: Task, next: Task["status"]) {
    setBusy(true);
    setError(null);
    try {
      const updated = (await apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      })) as Task;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(task: Task) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function StatusBadge({ value }: { value: Task["status"] }) {
    const cls =
      value === "Completed"
        ? "bg-emerald-950/40 text-emerald-200 ring-emerald-400/30"
        : value === "In Progress"
          ? "bg-amber-950/40 text-amber-200 ring-amber-400/30"
          : "bg-sky-950/40 text-sky-200 ring-sky-400/30";

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ${cls}`}>
        {value}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl p-6 sm:p-10 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Task Management</h1>
          </div>
        {me ? (
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-400">
              Signed in as <span className="font-medium text-zinc-100">{me.email}</span>
            </div>
            <button
              onClick={onLogout}
              disabled={busy}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        ) : null}
        </header>

        {error ? (
          <div className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        {initializing ? null : !me ? (
          <form onSubmit={onLogin} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Login</div>
              {busy ? <div className="text-xs text-zinc-400">Signing in…</div> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <div className="text-xs font-medium text-zinc-300">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
                  disabled={busy}
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-zinc-300">Password</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
                  disabled={busy}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            {null}
          </form>
        ) : (
          <>
            <form onSubmit={onCreateTask} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Create task</div>
                {busy ? <div className="text-xs text-zinc-400">Saving…</div> : null}
              </div>

              <label className="space-y-1 block">
                <div className="text-xs font-medium text-zinc-300">Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish report"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
                  required
                  disabled={busy}
                />
              </label>

              <label className="space-y-1 block">
                <div className="text-xs font-medium text-zinc-300">Description (optional)</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Extra details…"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
                  rows={3}
                  disabled={busy}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-zinc-300">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task["status"])}
                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                    disabled={busy}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">My tasks</div>
                <button
                  onClick={() => load().catch((e) => setError(e.message))}
                  disabled={busy}
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                  No tasks yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{task.title}</div>
                            <StatusBadge value={task.status} />
                          </div>
                          {task.description ? (
                            <div className="text-sm text-zinc-400 whitespace-pre-wrap">{task.description}</div>
                          ) : null}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm("Delete this task?")) onDelete(task);
                          }}
                          disabled={busy}
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="text-xs text-zinc-500">Update status</div>
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task, e.target.value as Task["status"])}
                          className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                          disabled={busy}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}