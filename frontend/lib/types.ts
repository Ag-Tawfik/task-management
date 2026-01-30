export type TaskStatus = "Pending" | "In Progress" | "Completed";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export type Me = {
  id: number;
  name: string;
  email: string;
};

export const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

const STATUS_SET = new Set<TaskStatus>(STATUSES);

export function isTaskStatus(value: string): value is TaskStatus {
  return STATUS_SET.has(value as TaskStatus);
}

export function coerceTaskStatus(value: string, fallback: TaskStatus = "Pending"): TaskStatus {
  return isTaskStatus(value) ? value : fallback;
}

