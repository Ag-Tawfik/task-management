import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { TaskTable } from "../TaskTable";
import type { Task } from "@/lib/types";

describe("TaskTable", () => {
  const task: Task = {
    id: 1,
    title: "Sample task",
    description: null,
    status: "Pending",
    user_id: 1,
    created_at: "2026-01-30T10:00:00.000Z",
    updated_at: "2026-01-30T10:00:00.000Z",
  };

  const baseProps = {
    tasks: [task],
    query: { search: "", sortBy: "created_at" as const, sortDir: "desc" as const, perPage: 10, page: 1 },
    pageInfo: { total: 1, totalPages: 1, showingFrom: 1, showingTo: 1 },
    busy: false,
    loading: false,
    onQueryChange: vi.fn(),
    onUpdateStatus: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it("updates status when selection changes", () => {
    render(<TaskTable {...baseProps} />);

    fireEvent.change(screen.getByDisplayValue("Pending"), { target: { value: "Completed" } });

    expect(baseProps.onUpdateStatus).toHaveBeenCalledWith(task, "Completed");
  });

  it("confirms before deleting", () => {
    render(<TaskTable {...baseProps} />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    const confirmButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(baseProps.onDelete).toHaveBeenCalledWith(task);
  });
});
