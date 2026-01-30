"use client";

export function Toast({
  message,
  variant = "error",
  onClose,
}: {
  message: string;
  variant?: "error" | "success";
  onClose?: () => void;
}) {
  const styles =
    variant === "success"
      ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
      : "border-red-900/50 bg-red-950/40 text-red-200";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start justify-between gap-3 rounded-md border p-3 text-sm ${styles}`}
    >
      <div>{message}</div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="text-xs uppercase tracking-wide text-zinc-300 hover:text-zinc-100"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}
