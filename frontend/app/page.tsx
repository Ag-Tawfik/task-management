"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "Pending" | "In Progress" | "Completed";
  user_id: number;
  created_at: string;
  updated_at: string;
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
    throw new Error(message);
  }

  return body;
}

export default function Home() {
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("user123");
  const [me, setMe] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("Pending");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  async function load() {
    setError(null);
    const user = await apiFetch("/me");
    setMe(user);
    const list = await apiFetch("/tasks");
    setTasks(list as Task[]);
  }

  useEffect(() => {
    // Try to load if token exists
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setHasToken(Boolean(token));

    if (token) {
      load().catch((e) => setError(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = (await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })) as any;
      localStorage.setItem("token", data.token);
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
      setMe(null);
      setTasks([]);
      setBusy(false);
    }
  }

  async function onCreateTask(e: React.FormEvent) {
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

  return (
    <div className="mx-auto max-w-3xl p-8 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Task Management</h1>
        {me ? (
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-600">
              Signed in as <span className="font-medium text-zinc-900">{me.email}</span>
            </div>
            <button
              onClick={onLogout}
              disabled={busy}
              className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        ) : null}
      </header>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      {!me ? (
        <form onSubmit={onLogin} className="rounded border p-4 space-y-3">
          <div className="text-sm font-medium">Login (API token)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Sign in
          </button>
          {!hasToken ? (
            <div className="text-xs text-zinc-500">
              Default seeded user: <span className="font-mono">user@example.com</span> /{" "}
              <span className="font-mono">user123</span> (admins must use Filament)
            </div>
          ) : null}
        </form>
      ) : (
        <>
          <form onSubmit={onCreateTask} className="rounded border p-4 space-y-3">
            <div className="text-sm font-medium">Create task</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded border px-3 py-2 text-sm"
              rows={3}
            />
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="rounded border px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>

          <section className="space-y-3">
            <div className="text-sm font-medium">My tasks</div>
            {tasks.length === 0 ? (
              <div className="rounded border p-4 text-sm text-zinc-600">No tasks yet.</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold">{task.title}</div>
                        {task.description ? <div className="text-sm text-zinc-600">{task.description}</div> : null}
                      </div>
                      <button
                        onClick={() => onDelete(task)}
                        disabled={busy}
                        className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="text-xs text-zinc-500">Status</div>
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task, e.target.value as Task["status"])}
                        className="rounded border px-3 py-1.5 text-sm"
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
  );
}