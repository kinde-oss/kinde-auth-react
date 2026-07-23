import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SwitchOrgLink } from ".";
import { useKindeAuth } from "../hooks/useKindeAuth";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("SwitchOrgLink Component", () => {
  const mockSwitchOrg = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      switchOrg: mockSwitchOrg,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should render correctly", async () => {
    await act(async () => {
      render(
        <SwitchOrgLink orgCode="org_123">Switch Org</SwitchOrgLink>,
      );
    });
    const linkElement = screen.getByText("Switch Org");
    expect(linkElement).toBeInTheDocument();
  });

  it("calls switchOrg with the correct orgCode when clicked", async () => {
    render(
      <SwitchOrgLink orgCode="org_123">Switch Org</SwitchOrgLink>,
    );

    const button = screen.getByRole("button", { name: "Switch Org" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSwitchOrg).toHaveBeenCalledTimes(1);
      expect(mockSwitchOrg).toHaveBeenCalledWith("org_123");
    });
  });

  it("passes HTML button props correctly", () => {
    render(
      <SwitchOrgLink orgCode="org_123" className="test-class" disabled>
        Switch Org
      </SwitchOrgLink>,
    );

    const button = screen.getByRole("button", { name: "Switch Org" });
    expect(button).toHaveClass("test-class");
    expect(button).toBeDisabled();
  });

  it("handles switchOrg errors gracefully", async () => {
    const mockError = new Error("Failed to switch organization");
    mockSwitchOrg.mockRejectedValueOnce(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SwitchOrgLink orgCode="org_123">Switch Org</SwitchOrgLink>,
    );
    const button = screen.getByRole("button", { name: "Switch Org" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSwitchOrg).toHaveBeenCalledTimes(1);
    });

    consoleSpy.mockRestore();
  });
});
