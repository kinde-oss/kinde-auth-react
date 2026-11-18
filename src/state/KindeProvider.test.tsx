import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  act,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { KindeProvider } from "./KindeProvider";
import React, { useContext } from "react";
import { KindeContext, KindeContextProps } from "./KindeContext";

const checkAuthMock = vi.fn(() => Promise.resolve());
const getUserProfileMock = vi.fn(() => Promise.resolve(undefined));
const generateAuthUrlMock = vi.fn(async () => ({
  url: new URL("https://example.com/login"),
}));
const navigateToKindeMock = vi.fn();
const isAuthenticatedMock = vi.fn(async () => false);
const exchangeAuthCodeMock = vi
  .fn()
  .mockResolvedValue({ success: false, error: "" });
const refreshTokenMock = vi.fn(async () => ({ success: true }) as unknown);
const stepUpMock = vi.fn(async () => ({
  url: new URL("https://example.com/step-up"),
}));
const stepUpRequiredFromResponseMock = vi.fn((): unknown => null);

vi.mock("@kinde/js-utils", () => {
  class MemoryStorage {
    private data = new Map<string, unknown>();
    private subscribers = new Set<() => void>();

    async getSessionItem(key: string) {
      return this.data.get(key);
    }

    async setSessionItem(key: string, value: unknown) {
      this.data.set(key, value);
      this.subscribers.forEach((fn) => fn());
    }

    async removeSessionItem(key: string) {
      this.data.delete(key);
      this.subscribers.forEach((fn) => fn());
    }

    subscribe(fn: () => void) {
      this.subscribers.add(fn);
      return () => this.subscribers.delete(fn);
    }

    reset() {
      this.data.clear();
      this.subscribers.clear();
    }
  }

  class LocalStorage<T extends string = string> extends MemoryStorage {}

  const storageSettings = {
    keyPrefix: "",
    useInsecureForRefreshToken: false,
    activityTimeoutMinutes: undefined as number | undefined,
    activityTimeoutPreWarningMinutes: undefined as number | undefined,
    onActivityTimeout: undefined as unknown,
  };

  const frameworkSettings = {
    framework: "",
    frameworkVersion: "",
    sdkVersion: "",
  };

  let activeStorage: MemoryStorage | null = null;
  const setActiveStorage = (storage: MemoryStorage) => {
    activeStorage = storage;
  };
  const getActiveStorage = () => activeStorage;
  const resetActiveStorage = () => {
    activeStorage?.reset();
    activeStorage = null;
  };
  const setInsecureStorage = () => undefined;

  const base64UrlEncode = (value: string) =>
    Buffer.from(value).toString("base64url");

  const base64UrlDecode = (value: string) =>
    Buffer.from(value, "base64url").toString("utf8");

  const noopAsync = async () => undefined;

  return {
    exchangeAuthCode: (...args: Parameters<typeof exchangeAuthCodeMock>) =>
      exchangeAuthCodeMock(...args),
    generateAuthUrl: (...args: Parameters<typeof generateAuthUrlMock>) =>
      generateAuthUrlMock(...args),
    frameworkSettings,
    getUserProfile: (...args: Parameters<typeof getUserProfileMock>) =>
      getUserProfileMock(...args),
    storageSettings,
    checkAuth: (...args: Parameters<typeof checkAuthMock>) =>
      checkAuthMock(...args),
    base64UrlEncode,
    base64UrlDecode,
    PromptTypes: { none: "none", create: "create", login: "login" },
    StorageKeys: {
      idToken: "idToken",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    },
    IssuerRouteTypes: { login: "login", register: "register" },
    getActiveStorage,
    Permissions: {} as unknown,
    refreshToken: (...args: Parameters<typeof refreshTokenMock>) =>
      refreshTokenMock(...args),
    PermissionAccess: {} as unknown,
    UserProfile: {} as unknown,
    LoginMethodParams: {} as unknown,
    LoginOptions: {} as unknown,
    getClaims: vi.fn(noopAsync),
    getClaim: vi.fn(noopAsync),
    getCurrentOrganization: vi.fn(noopAsync),
    getFlag: vi.fn(noopAsync),
    getPermission: vi.fn(noopAsync),
    getPermissions: vi.fn(noopAsync),
    getUserOrganizations: vi.fn(noopAsync),
    getRoles: vi.fn(noopAsync),
    generatePortalUrl: vi.fn(async () => ({
      url: new URL("https://example.com/portal"),
    })),
    Role: {} as unknown,
    GeneratePortalUrlParams: {} as unknown,
    navigateToKinde: (...args: Parameters<typeof navigateToKindeMock>) =>
      navigateToKindeMock(...args),
    setActiveStorage,
    resetActiveStorage,
    isAuthenticated: (...args: Parameters<typeof isAuthenticatedMock>) =>
      isAuthenticatedMock(...args),
    updateActivityTimestamp: vi.fn(),
    MemoryStorage,
    LocalStorage,
    setInsecureStorage,
    stepUp: (...args: Parameters<typeof stepUpMock>) => stepUpMock(...args),
    stepUpRequiredFromResponse: (
      ...args: Parameters<typeof stepUpRequiredFromResponseMock>
    ) => stepUpRequiredFromResponseMock(...args),
    isStepUpSupported: vi.fn(async () => true),
    getAuthenticationContext: vi.fn(noopAsync),
    hasAuthenticationContext: vi.fn(async () => false),
    UnmetAuthenticationRequirementsError: class extends Error {
      error = "unmet_authentication_requirements";
      errorDescription = "unmet";
    },
    LoginRequiredError: class extends Error {},
    StepUpRequiredError: class extends Error {},
  };
});

const TestConsumer = () => {
  const ctx = useContext(KindeContext);
  if (!ctx) return null;

  return (
    <div>
      <div data-testid="loading-indicator">{String(ctx.isLoading)}</div>
      <button type="button" onClick={() => ctx.login?.()}>
        Trigger Login
      </button>
    </div>
  );
};

// Extended consumer that surfaces all three fields relevant to the bug
const AuthStateConsumer = () => {
  const ctx = useContext(KindeContext);
  if (!ctx) return null;
  return (
    <div>
      <div data-testid="is-loading">{String(ctx.isLoading)}</div>
      <div data-testid="is-authenticated">{String(ctx.isAuthenticated)}</div>
      <div data-testid="user-id">{ctx.user?.id ?? "null"}</div>
    </div>
  );
};

const stubWindowLocalStorage = () => ({
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
});

describe("KindeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue(undefined);
    getUserProfileMock.mockResolvedValue(undefined);
    generateAuthUrlMock.mockResolvedValue({
      url: new URL("https://example.com/login"),
    });
    navigateToKindeMock.mockImplementation(() => undefined);
    isAuthenticatedMock.mockResolvedValue(false);
    exchangeAuthCodeMock.mockResolvedValueOnce({ success: true, error: "" });

    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    Object.defineProperty(window, "localStorage", {
      value: stubWindowLocalStorage(),
      configurable: true,
      writable: true,
    });
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000",
        search: "",
        pathname: "/",
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    const { resetActiveStorage } =
      (await import("@kinde/js-utils")) as unknown as {
        resetActiveStorage: () => void;
      };
    resetActiveStorage();
  });

  it("renders with provided redirectUri", async () => {
    render(
      <KindeProvider
        clientId="test"
        domain="test.com"
        redirectUri="http://localhost:3000"
      >
        <div>Test Child</div>
      </KindeProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(checkAuthMock).toHaveBeenCalled();
  });

  it("does not throw when window is undefined during first render (SSR-style)", () => {
    const prevWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    try {
      expect(() =>
        renderToString(
          <KindeProvider
            clientId="test"
            domain="test.com"
            redirectUri="http://localhost:3000"
          >
            <span>child</span>
          </KindeProvider>,
        ),
      ).not.toThrow();
    } finally {
      vi.stubGlobal("window", prevWindow);
    }
  });

  it("renders children in SSR output when forceChildrenRender is true", () => {
    const prevWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    try {
      const html = renderToString(
        <KindeProvider
          clientId="test"
          domain="test.com"
          redirectUri="http://localhost:3000"
          forceChildrenRender
        >
          <span data-testid="ssr-child">ssr content</span>
        </KindeProvider>,
      );
      expect(html).toContain("ssr content");
    } finally {
      vi.stubGlobal("window", prevWindow);
    }
  });

  it("does not render children in SSR output when forceChildrenRender is false", () => {
    const prevWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    try {
      const html = renderToString(
        <KindeProvider
          clientId="test"
          domain="test.com"
          redirectUri="http://localhost:3000"
        >
          <span data-testid="ssr-child">ssr content</span>
        </KindeProvider>,
      );
      expect(html).not.toContain("ssr content");
    } finally {
      vi.stubGlobal("window", prevWindow);
    }
  });

  it("does not render children while init is pending unless explicitly enabled", async () => {
    let resolveDefault: (() => void) | undefined;
    checkAuthMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDefault = resolve;
        }),
    );

    const noFlagView = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
      >
        <TestConsumer />
      </KindeProvider>,
    );

    expect(noFlagView.queryByTestId("loading-indicator")).toBeNull();

    await act(async () => {
      resolveDefault?.();
    });

    noFlagView.unmount();

    let resolveWithFlag: (() => void) | undefined;
    checkAuthMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveWithFlag = resolve;
        }),
    );

    const withFlagView = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender
      >
        <TestConsumer />
      </KindeProvider>,
    );

    await withFlagView.findByTestId("loading-indicator");

    await act(async () => {
      resolveWithFlag?.();
    });

    withFlagView.unmount();
  });

  it("toggles isLoading when login starts only if forceChildrenRender is true", async () => {
    const viewWithFlag = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender
      >
        <TestConsumer />
      </KindeProvider>,
    );

    await viewWithFlag.findByTestId("loading-indicator");
    await act(async () => {
      fireEvent.click(
        viewWithFlag.getByRole("button", { name: /trigger login/i }),
      );
    });

    await viewWithFlag.findByTestId("loading-indicator");
    expect(viewWithFlag.getByTestId("loading-indicator").textContent).toBe(
      "true",
    );

    viewWithFlag.unmount();

    const viewWithoutFlag = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
      >
        <TestConsumer />
      </KindeProvider>,
    );

    await viewWithoutFlag.findByTestId("loading-indicator");

    await act(async () => {
      fireEvent.click(
        viewWithoutFlag.getByRole("button", { name: /trigger login/i }),
      );
    });

    expect(viewWithoutFlag.getByTestId("loading-indicator").textContent).toBe(
      "false",
    );

    viewWithoutFlag.unmount();
  });

  it("initializes the SDK after invitation login fails so children render", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      generateAuthUrlMock.mockImplementation(() =>
        Promise.reject(new Error("simulated invitation failure")),
      );

      Object.defineProperty(window, "location", {
        value: {
          origin: "http://localhost:3000",
          href: "http://localhost:3000/?invitation_code=inv-1",
          pathname: "/",
          search: "?invitation_code=inv-1",
        },
        writable: true,
        configurable: true,
      });

      await act(async () => {
        render(
          <KindeProvider
            clientId="test"
            domain="test.com"
            redirectUri="http://localhost:3000"
          >
            <div>Test Child</div>
          </KindeProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Test Child")).toBeInTheDocument();
      });
    } finally {
      consoleErrorSpy.mockRestore();
      generateAuthUrlMock.mockImplementation(async () => ({
        url: new URL("https://example.com/login"),
      }));
    }
  });

  it("clears invitation pending after successful popup auth so init runs and children render", async () => {
    let handleResult:
      ((searchParams: URLSearchParams) => void | Promise<void>) | undefined;

    navigateToKindeMock.mockImplementation(
      (opts: {
        handleResult?: (p: URLSearchParams) => void | Promise<void>;
      }) => {
        handleResult = opts.handleResult;
      },
    );

    getUserProfileMock.mockResolvedValue({
      id: "user-invite-success",
      email: "invited@example.com",
    } as never);

    const invitationState = Buffer.from(
      JSON.stringify({ kinde: { event: "login" } }),
    ).toString("base64url");

    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/?invitation_code=inv-1",
        pathname: "/",
        search: "?invitation_code=inv-1",
      },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      render(
        <KindeProvider
          clientId="test"
          domain="test.com"
          redirectUri="http://localhost:3000"
        >
          <div>Test Child</div>
        </KindeProvider>,
      );
    });

    expect(screen.queryByText("Test Child")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(navigateToKindeMock).toHaveBeenCalled();
    });
    expect(handleResult).toBeDefined();

    await act(async () => {
      await handleResult!(
        new URLSearchParams({
          code: "auth-code-from-popup",
          state: invitationState,
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    expect(checkAuthMock).toHaveBeenCalled();
    expect(exchangeAuthCodeMock).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug fix: isLoading must not become false before user/isAuthenticated resolve
// ---------------------------------------------------------------------------
describe("isLoading timing — checkAuth failure path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue(undefined);
    getUserProfileMock.mockResolvedValue(undefined);
    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000",
        search: "",
        pathname: "/",
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    const { resetActiveStorage } =
      (await import("@kinde/js-utils")) as unknown as {
        resetActiveStorage: () => void;
      };
    resetActiveStorage();
  });

  it("keeps isLoading true while getUserProfile is pending after checkAuth throws", async () => {
    let resolveUser: (u: any) => void;

    // checkAuth throws — this is the scenario fixed by removing setState from catch
    checkAuthMock.mockRejectedValueOnce(new Error("token refresh failed"));

    // getUserProfile resolves only when we explicitly trigger it
    getUserProfileMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUser = resolve;
        }),
    );

    const view = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender
      >
        <AuthStateConsumer />
      </KindeProvider>,
    );

    // Wait for initStarted → children are in DOM
    await view.findByTestId("is-loading");

    // isLoading must still be true — getUserProfile hasn't resolved yet
    // Before the fix this would already be "false"
    expect(view.getByTestId("is-loading").textContent).toBe("true");
    expect(view.getByTestId("is-authenticated").textContent).toBe("false");
    expect(view.getByTestId("user-id").textContent).toBe("null");

    // Now resolve getUserProfile with a real user
    await act(async () => {
      resolveUser!({
        id: "user_01",
        given_name: "Jane",
        family_name: "Doe",
        email: "jane@example.com",
        picture: null,
      });
    });

    // After getUserProfile resolves: isLoading false, user populated
    expect(view.getByTestId("is-loading").textContent).toBe("false");
    expect(view.getByTestId("is-authenticated").textContent).toBe("true");
    expect(view.getByTestId("user-id").textContent).toBe("user_01");

    view.unmount();
  });

  it("keeps isLoading true while getUserProfile is pending when checkAuth succeeds", async () => {
    let resolveUser: (u: any) => void;

    // checkAuth resolves normally — baseline / regression check
    checkAuthMock.mockResolvedValueOnce(undefined);

    getUserProfileMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUser = resolve;
        }),
    );

    const view = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender
      >
        <AuthStateConsumer />
      </KindeProvider>,
    );

    await view.findByTestId("is-loading");
    expect(view.getByTestId("is-loading").textContent).toBe("true");

    await act(async () => {
      resolveUser!({
        id: "user_02",
        given_name: "John",
        family_name: "Smith",
        email: "john@example.com",
        picture: null,
      });
    });

    expect(view.getByTestId("is-loading").textContent).toBe("false");
    expect(view.getByTestId("is-authenticated").textContent).toBe("true");
    expect(view.getByTestId("user-id").textContent).toBe("user_02");

    view.unmount();
  });

  it("sets isLoading false with user null when getUserProfile returns nothing (unauthenticated)", async () => {
    checkAuthMock.mockResolvedValueOnce(undefined);
    // getUserProfile returns undefined → user is not authenticated
    getUserProfileMock.mockResolvedValueOnce(undefined);

    const view = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender
      >
        <AuthStateConsumer />
      </KindeProvider>,
    );

    await view.findByTestId("is-loading");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(view.getByTestId("is-loading").textContent).toBe("false");
    expect(view.getByTestId("is-authenticated").textContent).toBe("false");
    expect(view.getByTestId("user-id").textContent).toBe("null");

    view.unmount();
  });
});

describe("onError on token refresh failure paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue(undefined);
    getUserProfileMock.mockResolvedValue(undefined);
    isAuthenticatedMock.mockResolvedValue(false);
    refreshTokenMock.mockResolvedValue({ success: true });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000",
        search: "",
        pathname: "/",
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    const { resetActiveStorage } =
      (await import("@kinde/js-utils")) as unknown as {
        resetActiveStorage: () => void;
      };
    resetActiveStorage();
  });

  it("invokes onError when checkAuth resolves with a failure result", async () => {
    const onError = vi.fn();
    checkAuthMock.mockResolvedValueOnce({
      success: false,
      error: "refresh token expired",
    });

    render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        callbacks={{ onError }}
      >
        <div>child</div>
      </KindeProvider>,
    );

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(
      { error: "ERR_CHECK_AUTH", errorDescription: "refresh token expired" },
      {},
      expect.anything(),
    );
  });

  it("does not invoke onError when checkAuth resolves successfully", async () => {
    const onError = vi.fn();
    checkAuthMock.mockResolvedValueOnce({ success: true });

    render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        callbacks={{ onError }}
      >
        <div>child</div>
      </KindeProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onError).not.toHaveBeenCalled();
  });

  it("invokes onError exactly once when a focus refresh fails (refreshOnFocus)", async () => {
    const onError = vi.fn();

    // Authenticated so handleFocus passes its guard.
    isAuthenticatedMock.mockResolvedValue(true);
    getUserProfileMock.mockResolvedValue({
      id: "user_focus",
      given_name: "F",
      family_name: "L",
      email: "f@example.com",
      picture: null,
    });

    // js-utils resolves with a failure result AND invokes the supplied
    // onRefresh with it (mirroring the real implementation).
    refreshTokenMock.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ onRefresh }: any) => {
        const result = { success: false, error: "focus refresh failed" };
        onRefresh?.(result);
        return result;
      },
    );

    const view = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        refreshOnFocus
        callbacks={{ onError }}
      >
        <AuthStateConsumer />
      </KindeProvider>,
    );

    await waitFor(() =>
      expect(view.getByTestId("is-authenticated").textContent).toBe("true"),
    );

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(refreshTokenMock).toHaveBeenCalled());

    // Surfaced through onRefresh (single source) — not double-fired.
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      { error: "ERR_REFRESH_TOKEN", errorDescription: "focus refresh failed" },
      {},
      expect.anything(),
    );

    view.unmount();
  });
});

// ---------------------------------------------------------------------------
// Step-up authentication
// ---------------------------------------------------------------------------
describe("step-up authentication", () => {
  let ctx: KindeContextProps | null = null;
  const CaptureContext = () => {
    ctx = useContext(KindeContext);
    return null;
  };

  const encodeState = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  const setLocation = (url: string) => {
    const { origin, href, pathname, search, hash } = new URL(url);
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { origin, href, pathname, search, hash },
    });
  };

  const renderProvider = async (
    callbacks: React.ComponentProps<typeof KindeProvider>["callbacks"] = {},
  ) => {
    await act(async () => {
      render(
        <KindeProvider
          clientId="test"
          domain="https://test.kinde.com"
          redirectUri="http://localhost:3000/callback"
          callbacks={callbacks}
        >
          <CaptureContext />
        </KindeProvider>,
      );
    });
    await waitFor(() => expect(ctx).not.toBeNull());
  };

  // Captures the popup result handler that navigateToKinde receives.
  const capturePopupHandler = () => {
    const captured: { handle?: (p: URLSearchParams) => Promise<void> } = {};
    navigateToKindeMock.mockImplementation(
      (opts: { handleResult: (p: URLSearchParams) => Promise<void> }) => {
        captured.handle = opts.handleResult;
      },
    );
    return captured;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = null;
    getUserProfileMock.mockResolvedValue({ id: "user-1" } as never);
    navigateToKindeMock.mockImplementation(() => undefined);
    exchangeAuthCodeMock.mockReset();
    Object.defineProperty(window, "localStorage", {
      value: stubWindowLocalStorage(),
      configurable: true,
      writable: true,
    });
    setLocation("http://localhost:3000/settings/payouts?tab=bank");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    const { resetActiveStorage } =
      (await import("@kinde/js-utils")) as unknown as {
        resetActiveStorage: () => void;
      };
    resetActiveStorage();
  });

  it("builds the URL with js-utils stepUp, carrying returnTo in state", async () => {
    await renderProvider();

    await act(() => ctx!.stepUp({ acr: "mfa", maxAge: 300 }));

    const [domain, options] = stepUpMock.mock.calls[0] as unknown as [
      string,
      Record<string, string>,
    ];
    expect(domain).toBe("https://test.kinde.com");
    expect(options).toMatchObject({
      clientId: "test",
      acr: "mfa",
      maxAge: 300,
    });
    expect(
      JSON.parse(Buffer.from(options.state, "base64url").toString()),
    ).toEqual({
      kinde: { event: "stepUp" },
      returnTo: "/settings/payouts?tab=bank",
    });
    expect(navigateToKindeMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com/step-up" }),
    );
  });

  it("hands unmet_authentication_requirements to onError, without a new login", async () => {
    const { UnmetAuthenticationRequirementsError } =
      (await import("@kinde/js-utils")) as unknown as {
        UnmetAuthenticationRequirementsError: new () => Error;
      };
    const unmet = new UnmetAuthenticationRequirementsError();
    exchangeAuthCodeMock.mockRejectedValueOnce(unmet);
    const onError = vi.fn();
    const state = encodeState({ kinde: { event: "stepUp" } });
    setLocation(
      `http://localhost:3000/callback?error=unmet_authentication_requirements&state=${state}`,
    );

    await renderProvider({ onError });

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][0]).toEqual({
      error: "unmet_authentication_requirements",
      errorDescription: "unmet",
      cause: unmet,
    });
    expect(exchangeAuthCodeMock).toHaveBeenCalledTimes(1);
    expect(generateAuthUrlMock).not.toHaveBeenCalled();
    expect(navigateToKindeMock).not.toHaveBeenCalled();
    expect(ctx!.isAuthenticated).toBe(true);
  });

  it("forwards a step-up error from a popup to the opener", async () => {
    setLocation(
      "http://localhost:3000/callback?error=unmet_authentication_requirements&state=abc",
    );
    const postMessage = vi.fn();
    Object.defineProperty(window, "opener", {
      configurable: true,
      writable: true,
      value: { closed: false, location: window.location, postMessage },
    });
    Object.defineProperty(window, "close", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    try {
      await act(async () => {
        render(
          <KindeProvider
            clientId="test"
            domain="https://test.kinde.com"
            redirectUri="http://localhost:3000/callback"
          >
            <div />
          </KindeProvider>,
        );
      });
      await waitFor(() =>
        expect(postMessage).toHaveBeenCalledWith(
          {
            type: "KINDE_AUTH_RESULT",
            result: {
              error: "unmet_authentication_requirements",
              state: "abc",
            },
          },
          "http://localhost:3000",
        ),
      );
    } finally {
      window.opener = null;
    }
  });

  it("returns to returnTo after a successful step-up", async () => {
    const popup = capturePopupHandler();
    exchangeAuthCodeMock.mockResolvedValue({ success: true });
    await renderProvider();
    await act(() => ctx!.stepUp({ acr: "mfa" }));
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { state } = (
      stepUpMock.mock.calls[0] as unknown as [string, { state: string }]
    )[1];
    await act(() => popup.handle!(new URLSearchParams({ code: "c", state })));

    expect(replaceStateSpy).toHaveBeenLastCalledWith(
      {},
      expect.any(String),
      "/settings/payouts?tab=bank",
    );
  });

  it("starts a step-up from an API challenge, and ignores other responses", async () => {
    await renderProvider();
    const response = { status: 401, headers: new Headers() };

    await expect(ctx!.handleStepUpChallenge(response)).resolves.toBe(false);
    expect(stepUpMock).not.toHaveBeenCalled();

    stepUpRequiredFromResponseMock.mockReturnValueOnce({
      acr: "phr",
      maxAge: null,
    });
    await act(async () => {
      await expect(ctx!.handleStepUpChallenge(response)).resolves.toBe(true);
    });
    expect(stepUpMock).toHaveBeenCalledWith(
      "https://test.kinde.com",
      expect.objectContaining({ acr: "phr", maxAge: undefined }),
    );
  });
});
