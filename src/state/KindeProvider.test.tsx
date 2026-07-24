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
import { RefreshType } from "@kinde/js-utils";

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
  const isCustomDomain = (domain: string) =>
    !domain.match(/^(?:https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9.-]*\.kinde\.com$/i);

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
    isCustomDomain,
    RefreshType: { refreshToken: 0, cookie: 1 },
    MemoryStorage,
    LocalStorage,
    setInsecureStorage,
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

const ContextProbe = ({
  onReady,
}: {
  onReady: (ctx: KindeContextProps) => void;
}) => {
  const ctx = useContext(KindeContext);
  if (!ctx) return null;
  onReady(ctx);
  return null;
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
      | ((searchParams: URLSearchParams) => void | Promise<void>)
      | undefined;

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

  describe("refreshToken defaults for custom domains", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      checkAuthMock.mockResolvedValue(undefined);
      getUserProfileMock.mockResolvedValue(undefined);
      refreshTokenMock.mockResolvedValue({ success: true });
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
      const { resetActiveStorage } =
        (await import("@kinde/js-utils")) as unknown as {
          resetActiveStorage: () => void;
        };
      resetActiveStorage();
    });

    it("uses cookie refresh type by default for custom domains", async () => {
      let ctx: KindeContextProps | null = null;
      render(
        <KindeProvider
          clientId="client"
          domain="domain"
          redirectUri="http://localhost:3000"
        >
          <ContextProbe onReady={(value) => (ctx = value)} />
        </KindeProvider>,
      );

      await waitFor(() => expect(ctx).not.toBeNull());

      await act(async () => {
        await ctx!.refreshToken({
          domain: "https://acme.example.com",
          clientId: "client",
        });
      });

      expect(refreshTokenMock).toHaveBeenLastCalledWith({
        domain: "https://acme.example.com",
        clientId: "client",
        refreshType: RefreshType.cookie,
      });
    });

    it("does not override explicitly provided refreshType", async () => {
      let ctx: KindeContextProps | null = null;
      render(
        <KindeProvider
          clientId="client"
          domain="domain"
          redirectUri="http://localhost:3000"
        >
          <ContextProbe onReady={(value) => (ctx = value)} />
        </KindeProvider>,
      );

      await waitFor(() => expect(ctx).not.toBeNull());

      await act(async () => {
        await ctx!.refreshToken({
          domain: "https://acme.example.com",
          clientId: "client",
          refreshType: RefreshType.refreshToken,
        });
      });

      expect(refreshTokenMock).toHaveBeenLastCalledWith({
        domain: "https://acme.example.com",
        clientId: "client",
        refreshType: RefreshType.refreshToken,
      });
    });

    it("does not force cookie refresh when useInsecureForRefreshToken is enabled", async () => {
      let ctx: KindeContextProps | null = null;
      render(
        <KindeProvider
          clientId="client"
          domain="domain"
          redirectUri="http://localhost:3000"
          useInsecureForRefreshToken
        >
          <ContextProbe onReady={(value) => (ctx = value)} />
        </KindeProvider>,
      );

      await waitFor(() => expect(ctx).not.toBeNull());

      await act(async () => {
        await ctx!.refreshToken({
          domain: "https://acme.example.com",
          clientId: "client",
        });
      });

      expect(refreshTokenMock).toHaveBeenLastCalledWith({
        domain: "https://acme.example.com",
        clientId: "client",
      });
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
