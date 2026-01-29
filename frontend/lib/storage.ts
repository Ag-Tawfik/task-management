import type { Me } from "./types";

const TOKEN_KEY = "token";
const ME_KEY = "me";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, me: Me): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ME_KEY, JSON.stringify(me));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ME_KEY);
}

export function getStoredMe(): Me | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Me;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

