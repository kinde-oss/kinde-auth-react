import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { has } from "@kinde/js-utils";
import ProtectedRoute from "./ProtectedRoute";
import { useKindeAuth } from "../../hooks/useKindeAuth";

vi.mock("../../hooks/useKindeAuth", () => ({
  useKindeAuth: vi.fn(),
}));

vi.mock("@kinde/js-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@kinde/js-utils")>()),
  has: vi.fn(async () => true),
}));

vi.mock("react-router-dom", async () => {
  const { createElement } = await import("react");
  return {
    Navigate: ({ to }: { to: string }) =>
      createElement("div", { "data-testid": "navigate" }, to),
  };
});

const MARKER_KEY = "kinde_protected_route_step_up";

describe("ProtectedRoute step-up", () => {
  const auth = {
    isLoading: false,
    isAuthenticated: true,
    hasAuthenticationContext: vi.fn(),
    stepUp: vi.fn(),
  };

  const renderRoute = (
    props: Partial<React.ComponentProps<typeof ProtectedRoute>> = {},
  ) =>
    render(
      <ProtectedRoute acr="mfa" fallbackPath="/fallback" {...props}>
        <div>Secret</div>
      </ProtectedRoute>,
    );

  const expectFallback = async () =>
    expect(await screen.findByTestId("navigate")).toHaveTextContent(
      "/fallback",
    );

  const marker = () => {
    const raw = window.sessionStorage.getItem(MARKER_KEY);
    return raw ? JSON.parse(raw) : null;
  };

  const setMarker = (route: string, ageMs = 0) =>
    window.sessionStorage.setItem(
      MARKER_KEY,
      JSON.stringify({ route, at: Date.now() - ageMs }),
    );

  // In an iframe, the step-up runs in a popup and resolves on this page.
  const runInIframe = () =>
    vi.spyOn(window, "top", "get").mockReturnValue({} as Window);

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/payouts");
    auth.isAuthenticated = true;
    auth.hasAuthenticationContext.mockResolvedValue(false);
    auth.stepUp.mockResolvedValue(undefined);
    // A fresh object each render, like the real context value.
    vi.mocked(useKindeAuth).mockImplementation(
      () => ({ ...auth }) as unknown as ReturnType<typeof useKindeAuth>,
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sends a signed-out user to fallbackPath without a step-up", async () => {
    auth.isAuthenticated = false;
    renderRoute();

    await expectFallback();
    expect(auth.stepUp).not.toHaveBeenCalled();
  });

  it("renders children when the context is met", async () => {
    auth.hasAuthenticationContext.mockResolvedValue(true);
    renderRoute({ maxAge: 300 });

    expect(await screen.findByText("Secret")).toBeInTheDocument();
    expect(auth.hasAuthenticationContext).toHaveBeenCalledWith({
      acr: "mfa",
      maxAge: 300,
    });
    expect(auth.stepUp).not.toHaveBeenCalled();
  });

  it("starts one step-up when the context is unmet, even across re-renders", async () => {
    auth.stepUp.mockReturnValue(new Promise(() => undefined));
    const { rerender } = renderRoute();

    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));
    expect(auth.stepUp).toHaveBeenCalledWith({ acr: "mfa", maxAge: undefined });
    expect(marker()).toMatchObject({ route: "/payouts" });

    rerender(
      <ProtectedRoute acr="mfa" fallbackPath="/fallback">
        <div>Secret</div>
      </ProtectedRoute>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("stays loading after starting a full-page redirect", async () => {
    renderRoute();

    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(auth.hasAuthenticationContext).toHaveBeenCalledTimes(1);
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
  });

  it("renders children after a popup step-up that meets the context", async () => {
    runInIframe();
    auth.hasAuthenticationContext
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    renderRoute();

    expect(await screen.findByText("Secret")).toBeInTheDocument();
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(marker()).toBeNull();
  });

  it("goes to fallbackPath after a popup step-up that is still unmet, and doesn't retry on remount", async () => {
    runInIframe();
    const { unmount } = renderRoute();

    await expectFallback();
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(marker()).toMatchObject({ route: "/payouts" });

    unmount();
    renderRoute();
    await expectFallback();
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
  });

  it("clears the marker when stepUp rejects, so a later visit can try again", async () => {
    auth.stepUp.mockRejectedValueOnce(
      new Error("Step-up is not supported on this environment."),
    );
    const { unmount } = renderRoute();

    await expectFallback();
    expect(marker()).toBeNull();

    unmount();
    renderRoute();
    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(2));
  });

  it("waits, without a step-up, while another route's step-up is outstanding", async () => {
    setMarker("/other");
    renderRoute();

    await waitFor(() =>
      expect(auth.hasAuthenticationContext).toHaveBeenCalled(),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(auth.stepUp).not.toHaveBeenCalled();
    expect(marker()).toMatchObject({ route: "/other" });
  });

  it("starts a step-up when another route's marker has expired", async () => {
    setMarker("/other", 11 * 60 * 1000);
    renderRoute();

    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));
    expect(marker()).toMatchObject({ route: "/payouts" });
  });

  it("goes to fallbackPath when this route already stepped up", async () => {
    setMarker("/payouts");
    renderRoute();

    await expectFallback();
    expect(auth.stepUp).not.toHaveBeenCalled();
    expect(marker()).toBeNull();
  });

  it("denies access when has fails, without a step-up", async () => {
    vi.mocked(has).mockResolvedValueOnce(false);
    renderRoute({ has: { roles: ["admin"] } });

    await expectFallback();
    expect(auth.hasAuthenticationContext).not.toHaveBeenCalled();
    expect(auth.stepUp).not.toHaveBeenCalled();
  });

  it("passes maxAge={0} to stepUp as 0", async () => {
    renderRoute({ acr: undefined, maxAge: 0 });

    await waitFor(() =>
      expect(auth.stepUp).toHaveBeenCalledWith({
        acr: undefined,
        maxAge: 0,
      }),
    );
  });
});
