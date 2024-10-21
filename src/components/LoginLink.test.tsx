import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginLink } from ".";

afterEach(() => {
  cleanup();
});

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn().mockReturnValue({
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    getUser: vi.fn().mockReturnValue(null),
    store: {
      getSessionItem: vi.fn(),
      setSessionItem: vi.fn(),
    },
  }),
}));

vi.mock("@kinde/js-utils", async () => {
  const actual = await vi.importActual("@kinde/js-utils");
  return {
    ...actual,
    generateAuthUrl: vi.fn().mockResolvedValue({
      url: "https://www.example.com",
    }),
  };
});

describe("LoginLink Component", () => {
  it("should render correctly when authed", async () => {
    await act(async () => {
      render(<LoginLink>Login</LoginLink>);
    });
    const linkElement = screen.getByText("Login");
    expect(linkElement).toBeInTheDocument();
  });

  it("should render correctly when not authed", async () => {
    const { container } = render(<LoginLink>Login</LoginLink>);
    await waitFor(() => {
      expect(container.childElementCount).toEqual(0);
    });
  });
});
