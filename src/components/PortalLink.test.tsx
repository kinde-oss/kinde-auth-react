import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalLink } from ".";
import { useKindeAuth } from "../hooks/useKindeAuth";

vi.mock("../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

describe("ProfileLink Component", () => {
  const mockGeneratePortalUrl = vi.fn().mockReturnValue({
    url: new URL("https://example.com/profile"),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKindeAuth).mockReturnValue({
      generatePortalUrl: mockGeneratePortalUrl,
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
      render(<PortalLink>Profile</PortalLink>);
    });
    const linkElement = screen.getByText("Profile");
    expect(linkElement).toBeInTheDocument();
  });

  it("calls to generate profile link when clicked", async () => {
    render(<PortalLink>Profile</PortalLink>);

    const button = screen.getByRole("button", { name: "Profile" });
    fireEvent.click(button);

    expect(mockGeneratePortalUrl).toHaveBeenCalledTimes(1);
  });

  it("passes HTML button props correctly", () => {
    render(
      <PortalLink className="test-class" disabled>
        Profile
      </PortalLink>,
    );

    const button = screen.getByRole("button", { name: "Profile" });
    expect(button).toHaveClass("test-class");
    expect(button).toBeDisabled();
  });

  it("handles generatePortalUrl errors gracefully", async () => {
    const mockError = new Error("Failed to generate portal URL");
    mockGeneratePortalUrl.mockRejectedValueOnce(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PortalLink>Profile</PortalLink>);
    const button = screen.getByRole("button", { name: "Profile" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGeneratePortalUrl).toHaveBeenCalledTimes(1);
    });

    consoleSpy.mockRestore();
  });
});
