import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StepUpLink } from "./StepUpLink";
import { useKindeAuth } from "../hooks/useKindeAuth";
import React from "react";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("StepUpLink", () => {
  const mockStepUp = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      stepUp: mockStepUp,
    } as unknown as ReturnType<typeof useKindeAuth>);
  });

  afterEach(() => {
    cleanup();
  });

  it("calls stepUp with the requirement, keeping it off the button", () => {
    const onClick = vi.fn();
    render(
      <StepUpLink acr="mfa" maxAge={300} returnTo="/payouts" onClick={onClick}>
        Verify
      </StepUpLink>,
    );

    const button = screen.getByRole("button", { name: "Verify" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mockStepUp).toHaveBeenCalledWith({
      acr: "mfa",
      maxAge: 300,
      returnTo: "/payouts",
    });
    expect(button).not.toHaveAttribute("acr");
    expect(button).not.toHaveAttribute("maxage");
  });
});
