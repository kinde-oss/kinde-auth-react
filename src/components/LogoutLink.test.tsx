import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginLink, LogoutLink } from ".";
import { useKindeAuth } from "../hooks/useKindeAuth";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("RegisterLink Component", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      logout: mockLogout,
      store: {
        getSessionItem: vi.fn().mockResolvedValue("example.com"),
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should render correctly when authed", async () => {
    await act(async () => {
      render(<LogoutLink>Login</LogoutLink>);
    });
    const linkElement = screen.getByText("Login");
    expect(linkElement).toBeInTheDocument();
  });

  it("calls login when clicked", async () => {
    render(<LogoutLink>Logout</LogoutLink>);

    const button = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(button);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    // expect(mockLogout).toHaveBeenCalledWith({ audience: 'test-audience' });
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

  // it.only('preserves custom onClick handler while calling login', () => {
  //   const customOnClick = vi.fn();
  //   render(
  //     <LoginLink onClick={customOnClick}>
  //       Login
  //     </LoginLink>
  //   );

  //   const button = screen.getByRole('button', { name: 'Login' });
  //   fireEvent.click(button);

  //   expect(customOnClick).toHaveBeenCalled();
  //   expect(mockLogin).toHaveBeenCalled();
  // });
});
