import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { KindeProvider } from "./KindeProvider";
import React, { useContext } from "react";
import { KindeContext } from "./KindeContext";

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
    PromptTypes: { login: "login", register: "register" },
    StorageKeys: {
      idToken: "idToken",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    },
    IssuerRouteTypes: { login: "login", register: "register" },
    getActiveStorage,
    Permissions: {} as unknown,
    refreshToken: vi.fn(noopAsync),
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

    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    global.window = Object.create(window);
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
    const { resetActiveStorage } = (await import(
      "@kinde/js-utils"
    )) as unknown as {
      resetActiveStorage: () => void;
    };
    resetActiveStorage();
  });

  it("renders with provided redirectUri", async () => {
    render(
      <KindeProvider
        clientId="test"
        domain="test.com"
        redirectUri="http://localhost:3000">
        <div>Test Child</div>
      </KindeProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(checkAuthMock).toHaveBeenCalled();
  });

  it("does not render children while init is pending unless explicitly enabled", async () => {
    let resolveDefault: (() => void) | undefined;
    checkAuthMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDefault = resolve;
        })
    );

    const noFlagView = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000">
        <TestConsumer />
      </KindeProvider>
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
        })
    );

    const withFlagView = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000"
        forceChildrenRender>
        <TestConsumer />
      </KindeProvider>
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
        forceChildrenRender>
        <TestConsumer />
      </KindeProvider>
    );

    await viewWithFlag.findByTestId("loading-indicator");
    await act(async () => {
      fireEvent.click(
        viewWithFlag.getByRole("button", { name: /trigger login/i })
      );
    });

    await viewWithFlag.findByTestId("loading-indicator");
    expect(viewWithFlag.getByTestId("loading-indicator").textContent).toBe(
      "true"
    );

    viewWithFlag.unmount();

    const viewWithoutFlag = render(
      <KindeProvider
        clientId="client"
        domain="domain"
        redirectUri="http://localhost:3000">
        <TestConsumer />
      </KindeProvider>
    );

    await viewWithoutFlag.findByTestId("loading-indicator");

    await act(async () => {
      fireEvent.click(
        viewWithoutFlag.getByRole("button", { name: /trigger login/i })
      );
    });

    expect(viewWithoutFlag.getByTestId("loading-indicator").textContent).toBe(
      "false"
    );

    viewWithoutFlag.unmount();
  });
});
