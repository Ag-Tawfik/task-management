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

  // create
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("Pending");

  // edit
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<Task["status"]>("Pending");

  // ui
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "status" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

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
      // Dev convenience: prefill tester credentials.
      if (process.env.NODE_ENV !== "production") {
        setEmail((v) => v || "user@example.com");
        setPassword((v) => v || "password");
      }
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
      setShowNew(false);
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

  function openEdit(task: Task) {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditStatus(task.status);
  }

  function closeEdit() {
    setEditTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditStatus("Pending");
  }

  async function onSaveEdit() {
    if (!editTask) return;
    setBusy(true);
    setError(null);
    try {
      const updated = (await apiFetch(`/tasks/${editTask.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription.trim() ? editDescription : null,
          status: editStatus,
        }),
      })) as Task;

      setTasks((prev) => prev.map((t) => (t.id === editTask.id ? updated : t)));
      closeEdit();
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

  useEffect(() => {
    setPage(1);
  }, [search, perPage]);

  function toggleSort(next: typeof sortBy) {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(next);
    setSortDir(next === "created_at" ? "desc" : "asc");
  }

  const filteredTasks = tasks.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "created_at") {
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    }
    if (sortBy === "title") return a.title.localeCompare(b.title) * dir;
    return a.status.localeCompare(b.status) * dir;
  });

  const total = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * perPage;
  const pageItems = sortedTasks.slice(startIdx, startIdx + perPage);
  const showingFrom = total === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(total, startIdx + perPage);

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

  function openNew() {
    setTitle("");
    setDescription("");
    setStatus("Pending");
    setShowNew(true);
  }

  function closeNew() {
    setShowNew(false);
  }

  function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
    if (!active) return <span className="text-zinc-500">▾</span>;
    return <span className="text-zinc-300">{dir === "asc" ? "▴" : "▾"}</span>;
  }

  function formatDate(value: string) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl p-6 sm:p-10 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{me ? "Tasks" : "Task Manager"}</h1>
          </div>
        {me ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openNew}
              disabled={busy}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
            >
              New task
            </button>
            <button
              onClick={onLogout}
              disabled={busy}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
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
            {/* Search */}
            <div className="flex justify-end">
              <div className="relative w-full sm:w-80">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">⌕</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-9 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/60 text-zinc-300">
                    <tr className="border-b border-zinc-800">
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort("title")}
                          className="inline-flex items-center gap-2 font-semibold"
                        >
                          Title <SortIcon active={sortBy === "title"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="inline-flex items-center gap-2 font-semibold"
                        >
                          Status <SortIcon active={sortBy === "status"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort("created_at")}
                          className="inline-flex items-center gap-2 font-semibold"
                        >
                          Created at <SortIcon active={sortBy === "created_at"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="w-24 px-4 py-3 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                          No results.
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((task) => (
                        <tr key={task.id} className="border-b border-zinc-800 last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-100">{task.title}</div>
                            {task.description ? (
                              <div className="mt-1 line-clamp-1 text-xs text-zinc-400">{task.description}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(e) => onUpdateStatus(task, e.target.value as Task["status"])}
                              disabled={busy}
                              className="rounded-full border border-transparent bg-zinc-900/0 px-2 py-1 text-xs font-medium text-zinc-100 ring-1 ring-zinc-700/60 hover:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-zinc-200">{formatDate(task.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => openEdit(task)}
                                className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300"
                              >
                                ✎ <span className="font-medium">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Delete this task?")) onDelete(task);
                                }}
                                disabled={busy}
                                className="inline-flex items-center gap-2 text-red-300 hover:text-red-200 disabled:opacity-50"
                              >
                                🗑 <span className="font-medium">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-900/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-400">
                  Showing {showingFrom} to {showingTo} of {total} results
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>Per page</span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <div className="text-sm text-zinc-400">
                      {safePage}/{totalPages}
                    </div>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* New task modal */}
            {showNew ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute inset-0 bg-black/60"
                  onClick={closeNew}
                />
                <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">New task</div>
                    <button
                      type="button"
                      onClick={closeNew}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm hover:bg-zinc-800"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={onCreateTask} className="space-y-4">
                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Title</div>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        required
                        disabled={busy}
                      />
                    </label>

                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Description (optional)</div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        rows={4}
                        disabled={busy}
                      />
                    </label>

                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Status</div>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Task["status"])}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        disabled={busy}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeNew}
                        disabled={busy}
                        className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {/* Edit task modal */}
            {editTask ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute inset-0 bg-black/60"
                  onClick={closeEdit}
                />
                <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">Edit task</div>
                    <button
                      type="button"
                      onClick={closeEdit}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm hover:bg-zinc-800"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Title</div>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        disabled={busy}
                      />
                    </label>

                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Description (optional)</div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        rows={4}
                        disabled={busy}
                      />
                    </label>

                    <label className="block space-y-1">
                      <div className="text-xs font-medium text-zinc-300">Status</div>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as Task["status"])}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                        disabled={busy}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={closeEdit}
                          disabled={busy}
                          className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onSaveEdit}
                          disabled={busy || !editTitle.trim()}
                          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}