import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import "@testing-library/jest-dom/matchers";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import React from "react";
import { RegisterLink } from "./RegisterLink";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("RegisterLink", () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      register: mockRegister,
      store: {
        getSessionItem: vi.fn().mockResolvedValue("example.com"),
      },
    });
  });

  afterEach(() => {
    cleanup(); // Clean up after each test
  });

  it("renders with children", () => {
    const { container } = render(<RegisterLink>Register</RegisterLink>);

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(container.textContent).toBe("Register");
  });

  it("calls login when clicked", async () => {
    render(<RegisterLink audience="test-audience">Register</RegisterLink>);

    const button = screen.getByRole("button", { name: "Register" });
    fireEvent.click(button);

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({ audience: "test-audience" });
  });

  it("passes HTML button props correctly", () => {
    render(
      <RegisterLink className="test-class" disabled>
        Register
      </RegisterLink>,
    );

    const button = screen.getByRole("button", { name: "Register" });
    expect(button).toHaveClass("test-class");
    expect(button).toBeDisabled();
  });

  it("preserves custom onClick handler while calling login", () => {
    const customOnClick = vi.fn();
    render(<RegisterLink onClick={customOnClick}>Register</RegisterLink>);

    const button = screen.getByRole("button", { name: "Register" });
    fireEvent.click(button);

    expect(customOnClick).toHaveBeenCalled();
    expect(mockRegister).toHaveBeenCalled();
  });
});
