"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthForm } from "@/app/_components/AuthForm";
import { EditTaskModal } from "@/app/_components/EditTaskModal";
import { NewTaskModal } from "@/app/_components/NewTaskModal";
import { TaskTable } from "@/app/_components/TaskTable";
import { Toast } from "@/app/_components/Toast";
import { apiFetch, buildQuery, ensureCsrfCookie } from "@/lib/api";
import type { Me, Task, TaskStatus } from "@/lib/types";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [editTask, setEditTask] = useState<Task | null>(null);

  // ui
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const [query, setQuery] = useState<{
    search: string;
    sortBy: "title" | "status" | "created_at";
    sortDir: "asc" | "desc";
    perPage: number;
    page: number;
  }>({
    search: "",
    sortBy: "created_at",
    sortDir: "desc",
    perPage: 10,
    page: 1,
  });

  const [pageInfo, setPageInfo] = useState<{
    total: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
  }>({
    total: 0,
    totalPages: 1,
    showingFrom: 0,
    showingTo: 0,
  });

  const devDefaultEmail = process.env.NODE_ENV !== "production" ? "user@example.com" : undefined;
  const devDefaultPassword = process.env.NODE_ENV !== "production" ? "password" : undefined;

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const loadTasks = useCallback(async (q: typeof query) => {
    setLoadingTasks(true);
    setError(null);
    try {
      const qs = buildQuery({
        search: q.search,
        sort_by: q.sortBy,
        sort_dir: q.sortDir,
        per_page: q.perPage,
        page: q.page,
      });
      const res = (await apiFetch(`/tasks${qs}`)) as any;
      const data = Array.isArray(res?.data) ? (res.data as Task[]) : [];
      setTasks(data);

      const total = Number(res?.total ?? data.length);
      const lastPage = Number(res?.last_page ?? 1);
      const from = Number(res?.from ?? (data.length ? (q.page - 1) * q.perPage + 1 : 0));
      const to = Number(res?.to ?? (data.length ? from + data.length - 1 : 0));

      setPageInfo({
        total: Number.isFinite(total) ? total : data.length,
        totalPages: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
        showingFrom: Number.isFinite(from) ? from : 0,
        showingTo: Number.isFinite(to) ? to : 0,
      });
    } catch (e: any) {
      if (e?.status === 401) {
        setMe(null);
        setTasks([]);
        setPageInfo({ total: 0, totalPages: 1, showingFrom: 0, showingTo: 0 });
        setError("Session expired. Please sign in again.");
        return;
      }
      setError(e?.message ?? "Failed to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setInitializing(true);
      try {
        const res = (await apiFetch("/auth/me")) as any;
        if (res?.user?.email) {
          setMe(res.user as Me);
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!me) return;
    void loadTasks(query);
  }, [me, query, loadTasks]);

  const onLogin = useCallback(async (email: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      const data = (await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })) as any;
      setMe(data.user as Me);
      setQuery((q) => ({ ...q, page: 1 }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const onLogout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setMe(null);
      setTasks([]);
      setPageInfo({ total: 0, totalPages: 1, showingFrom: 0, showingTo: 0 });
      setBusy(false);
    }
  }, []);

  const onCreateTask = useCallback(async (payload: { title: string; description: string | null; status: TaskStatus }) => {
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowNew(false);
      setQuery((q) => ({ ...q, page: 1 }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const onUpdateStatus = useCallback(
    async (task: Task, next: Task["status"]) => {
      setBusy(true);
      setError(null);
      const previous = tasks;
      setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
      try {
        await ensureCsrfCookie();
        await apiFetch(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        });
        await loadTasks(queryRef.current);
      } catch (e: any) {
        setTasks(previous);
        setError(e.message);
      } finally {
        setBusy(false);
      }
    },
    [loadTasks, tasks]
  );

  const openEdit = useCallback((task: Task) => {
    setEditTask(task);
  }, []);

  const closeEdit = useCallback(() => {
    setEditTask(null);
  }, []);

  const onSaveEdit = useCallback(
    async (payload: { id: number; title: string; description: string | null; status: TaskStatus }) => {
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch(`/tasks/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          status: payload.status,
        }),
      });
      await loadTasks(queryRef.current);
      closeEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
    },
    [closeEdit, loadTasks]
  );

  const onDelete = useCallback(async (task: Task) => {
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfCookie();
      await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      await loadTasks(queryRef.current);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [loadTasks]);

  const onQueryChange = useCallback(
    (next: Partial<typeof query>) => {
      setQuery((q) => ({
        ...q,
        ...next,
      }));
    },
    [setQuery]
  );

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
                onClick={() => setShowNew(true)}
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

        {error ? <Toast message={error} onClose={() => setError(null)} /> : null}

        {initializing ? null : !me ? (
          <AuthForm
            busy={busy}
            defaultEmail={devDefaultEmail}
            defaultPassword={devDefaultPassword}
            onLogin={onLogin}
          />
        ) : (
          <>
            <TaskTable
              tasks={tasks}
              query={query}
              pageInfo={pageInfo}
              busy={busy || loadingTasks}
              loading={loadingTasks}
              onQueryChange={onQueryChange}
              onUpdateStatus={onUpdateStatus}
              onEdit={openEdit}
              onDelete={onDelete}
            />

            <NewTaskModal
              open={showNew}
              busy={busy}
              onClose={() => setShowNew(false)}
              onCreate={onCreateTask}
            />

            <EditTaskModal task={editTask} busy={busy} onClose={closeEdit} onSave={onSaveEdit} />
          </>
        )}
      </div>
    </div>
  );
}