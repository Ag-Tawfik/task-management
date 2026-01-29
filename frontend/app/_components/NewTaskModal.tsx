"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import type { TaskStatus } from "@/lib/types";
import { STATUSES } from "@/lib/types";

export function NewTaskModal({
  open,
  busy,
  onClose,
  onCreate,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description: string | null; status: TaskStatus }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Pending");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setStatus("Pending");
  }, [open]);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onCreate({
      title,
      description: description.trim() ? description : null,
      status,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">New task</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
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
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
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
              onClick={onClose}
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
  );
}

