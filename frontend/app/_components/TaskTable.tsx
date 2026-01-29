"use client";

import { memo } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUSES } from "@/lib/types";

export const TaskTable = memo(function TaskTable({
  tasks,
  query,
  pageInfo,
  busy,
  onQueryChange,
  onUpdateStatus,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  query: { search: string; sortBy: "title" | "status" | "created_at"; sortDir: "asc" | "desc"; perPage: number; page: number };
  pageInfo: { total: number; totalPages: number; showingFrom: number; showingTo: number };
  busy: boolean;
  onQueryChange: (next: {
    search?: string;
    sortBy?: "title" | "status" | "created_at";
    sortDir?: "asc" | "desc";
    perPage?: number;
    page?: number;
  }) => void;
  onUpdateStatus: (task: Task, next: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  function toggleSort(next: "title" | "status" | "created_at") {
    if (query.sortBy === next) {
      onQueryChange({ sortDir: query.sortDir === "asc" ? "desc" : "asc" });
      return;
    }
    onQueryChange({ sortBy: next, sortDir: next === "created_at" ? "desc" : "asc" });
  }

  return (
    <>
      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">⌕</div>
          <input
            value={query.search}
            onChange={(e) => onQueryChange({ search: e.target.value, page: 1 })}
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
                    Title <SortIcon active={query.sortBy === "title"} dir={query.sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-2 font-semibold"
                  >
                    Status <SortIcon active={query.sortBy === "status"} dir={query.sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort("created_at")}
                    className="inline-flex items-center gap-2 font-semibold"
                  >
                    Created at <SortIcon active={query.sortBy === "created_at"} dir={query.sortDir} />
                  </button>
                </th>
                <th className="w-24 px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                    No results.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
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
                        onChange={(e) => onUpdateStatus(task, e.target.value as TaskStatus)}
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
                          onClick={() => onEdit(task)}
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
            Showing {pageInfo.showingFrom} to {pageInfo.showingTo} of {pageInfo.total} results
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Per page</span>
              <select
                value={query.perPage}
                onChange={(e) => onQueryChange({ perPage: Number(e.target.value), page: 1 })}
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
                disabled={query.page <= 1}
                onClick={() => onQueryChange({ page: Math.max(1, query.page - 1) })}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-zinc-400">
                {query.page}/{pageInfo.totalPages}
              </div>
              <button
                type="button"
                disabled={query.page >= pageInfo.totalPages}
                onClick={() => onQueryChange({ page: Math.min(pageInfo.totalPages, query.page + 1) })}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <span className="text-zinc-500">▾</span>;
  return <span className="text-zinc-300">{dir === "asc" ? "▴" : "▾"}</span>;
}

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

