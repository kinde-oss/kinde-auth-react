import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);
import "@testing-library/jest-dom/matchers";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LoginLink } from "./LoginLink";
import { useKindeAuth } from "../hooks/useKindeAuth";
import React from "react";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("LoginLink", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      login: mockLogin,
      store: {
        getSessionItem: vi.fn().mockResolvedValue("example.com"),
      },
    });
  });

  afterEach(() => {
    cleanup(); // Clean up after each test
  });

  it("renders with children", () => {
    const { container } = render(<LoginLink>Login</LoginLink>);

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(container.textContent).toBe("Login");
  });

  it("calls login when clicked", async () => {
    render(<LoginLink audience="test-audience">Login</LoginLink>);

    const button = screen.getByRole("button", { name: "Login" });
    fireEvent.click(button);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ audience: "test-audience" });
  });

  it("passes HTML button props correctly", () => {
    render(
      <LoginLink className="test-class" disabled>
        Login
      </LoginLink>,
    );

    const button = screen.getByRole("button", { name: "Login" });
    expect(button).toHaveClass("test-class");
    expect(button).toBeDisabled();
  });

  it("preserves custom onClick handler while calling login", () => {
    const customOnClick = vi.fn();
    render(<LoginLink onClick={customOnClick}>Login</LoginLink>);

    const button = screen.getByRole("button", { name: "Login" });
    fireEvent.click(button);

    expect(customOnClick).toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalled();
  });
});
