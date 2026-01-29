"use client";

import { useState, type SyntheticEvent } from "react";

export function AuthForm({
  busy,
  defaultEmail,
  defaultPassword,
  onLogin,
}: {
  busy: boolean;
  defaultEmail?: string;
  defaultPassword?: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState(defaultPassword ?? "");

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onLogin(email, password);
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 space-y-4">
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
    </form>
  );
}

