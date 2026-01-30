import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { AuthForm } from "../AuthForm";

describe("AuthForm", () => {
  it("submits email and password", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);

    render(<AuthForm busy={false} onLogin={onLogin} />);

    fireEvent.change(screen.getByPlaceholderText("user@example.com"), { target: { value: "user@site.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);

    expect(onLogin).toHaveBeenCalledWith("user@site.com", "password");
  });
});
