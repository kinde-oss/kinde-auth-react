import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import React, {
  StrictMode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
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

// Under StrictMode the component imports this module twice at once, and
// Vitest returns the real module for the second import. StrictMode tests here
// must not render <Navigate>.
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

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

  it("checks again when another route's marker expires while mounted", async () => {
    setMarker("/other", 10 * 60 * 1000 - 300);
    renderRoute();

    await waitFor(() =>
      expect(auth.hasAuthenticationContext).toHaveBeenCalledTimes(1),
    );
    expect(auth.stepUp).not.toHaveBeenCalled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Once the other route's attempt expires, this route starts its own.
    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    expect(marker()).toMatchObject({ route: "/payouts" });
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

  it("starts one step-up under StrictMode, without going to fallbackPath", async () => {
    auth.hasAuthenticationContext.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(false), 20)),
    );
    auth.stepUp.mockReturnValue(new Promise(() => undefined));
    render(
      <StrictMode>
        <ProtectedRoute acr="mfa" fallbackPath="/fallback">
          <div>Secret</div>
        </ProtectedRoute>
      </StrictMode>,
    );

    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
    expect(marker()).toMatchObject({ route: "/payouts" });
  });

  it("lets only the latest check use this route's marker", async () => {
    // A superseded check (StrictMode, or new props) must not consume the
    // marker, or the latest check would find none and step up again.
    setMarker("/payouts");
    auth.hasAuthenticationContext.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(false), 20)),
    );
    const { rerender } = renderRoute({ has: { roles: ["admin"] } });
    rerender(
      <ProtectedRoute
        acr="mfa"
        has={{ roles: ["admin"] }}
        fallbackPath="/fallback"
      >
        <div>Secret</div>
      </ProtectedRoute>,
    );

    await expectFallback();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(auth.stepUp).not.toHaveBeenCalled();
  });

  it("doesn't step up when the route unmounts during the check", async () => {
    let resolveContext: (met: boolean) => void = () => undefined;
    auth.hasAuthenticationContext.mockReturnValue(
      new Promise((resolve) => (resolveContext = resolve)),
    );
    const { unmount } = renderRoute();
    await waitFor(() =>
      expect(auth.hasAuthenticationContext).toHaveBeenCalled(),
    );

    unmount();
    resolveContext(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(auth.stepUp).not.toHaveBeenCalled();
    expect(marker()).toBeNull();
  });

  it("doesn't render children from an earlier grant while a new check waits", async () => {
    auth.hasAuthenticationContext.mockResolvedValue(true);
    const { rerender } = renderRoute();
    expect(await screen.findByText("Secret")).toBeInTheDocument();

    setMarker("/other");
    auth.hasAuthenticationContext.mockResolvedValue(false);
    rerender(
      <ProtectedRoute acr="mfa" maxAge={300} fallbackPath="/fallback">
        <div>Secret</div>
      </ProtectedRoute>,
    );

    await waitFor(() =>
      expect(auth.hasAuthenticationContext).toHaveBeenCalledTimes(2),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("finishes a popup step-up whose check was superseded by a re-render", async () => {
    runInIframe();
    let resolveStepUp: () => void = () => undefined;
    auth.stepUp.mockReturnValue(
      new Promise<void>((resolve) => (resolveStepUp = resolve)),
    );
    const { rerender } = renderRoute({ has: { roles: ["admin"] } });
    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));

    // A new `has` object each render re-runs the effect.
    rerender(
      <ProtectedRoute
        acr="mfa"
        has={{ roles: ["admin"] }}
        fallbackPath="/fallback"
      >
        <div>Secret</div>
      </ProtectedRoute>,
    );
    auth.hasAuthenticationContext.mockResolvedValue(true);
    resolveStepUp();

    expect(await screen.findByText("Secret")).toBeInTheDocument();
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(marker()).toBeNull();
  });

  it("doesn't retry a failed stepUp when the provider re-renders", async () => {
    // Like KindeProvider with forceChildrenRender: stepUp calls setLoading,
    // which changes the context value and re-runs the check.
    const Ctx = createContext<unknown>(null);
    const Provider = ({ children }: { children: React.ReactNode }) => {
      const [version, setVersion] = useState(0);
      const value = useMemo(
        () => ({
          version,
          isLoading: false,
          isAuthenticated: true,
          hasAuthenticationContext: async () => false,
          stepUp: async () => {
            auth.stepUp();
            if (auth.stepUp.mock.calls.length > 5) {
              return new Promise(() => undefined);
            }
            setVersion((v) => v + 1); // setLoading(true)
            await Promise.resolve();
            setVersion((v) => v + 1); // setLoading(false)
            throw new Error("Step-up is not supported on this environment.");
          },
        }),
        [version],
      );
      return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
    };
    vi.mocked(useKindeAuth).mockImplementation(
      () => useContext(Ctx) as ReturnType<typeof useKindeAuth>,
    );
    render(
      <Provider>
        <ProtectedRoute acr="mfa" fallbackPath="/fallback">
          <div>Secret</div>
        </ProtectedRoute>
      </Provider>,
    );

    await expectFallback();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(auth.stepUp).toHaveBeenCalledTimes(1);
    expect(marker()).toBeNull();
  });

  it("renders children when stepUp fails after the requirement was removed", async () => {
    let rejectStepUp: (error: Error) => void = () => undefined;
    auth.stepUp.mockReturnValue(
      new Promise((_, reject) => (rejectStepUp = reject)),
    );
    const { rerender } = renderRoute();
    await waitFor(() => expect(auth.stepUp).toHaveBeenCalledTimes(1));

    rerender(
      <ProtectedRoute fallbackPath="/fallback">
        <div>Secret</div>
      </ProtectedRoute>,
    );
    rejectStepUp(new Error("Popup blocked"));

    expect(await screen.findByText("Secret")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("goes to fallbackPath, without a step-up, when the marker can't be stored", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    renderRoute();

    await expectFallback();
    expect(auth.stepUp).not.toHaveBeenCalled();
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
