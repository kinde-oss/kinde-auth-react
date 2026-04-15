import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, screen, waitFor } from "@testing-library/react";
import { KindeProvider } from "./KindeProvider";
import React from "react";
import { generateAuthUrl } from "@kinde/js-utils";

const mockStorage = vi.hoisted(() => ({
  getSessionItem: vi.fn(),
  setSessionItem: vi.fn(),
  removeSessionItem: vi.fn(),
}));

vi.mock("../utils/storage", () => ({
  createStorage: () => mockStorage,
}));

const kindeReal = vi.hoisted(() => ({
  generateAuthUrl: null! as typeof import("@kinde/js-utils").generateAuthUrl,
}));

vi.mock("@kinde/js-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kinde/js-utils")>();
  kindeReal.generateAuthUrl = actual.generateAuthUrl;
  return {
    ...actual,
    generateAuthUrl: vi.fn(
      (...args: Parameters<typeof actual.generateAuthUrl>) =>
        actual.generateAuthUrl(...args),
    ),
  };
});

describe("KindeProvider", () => {
  const stubWindowLocalStorage = () => ({
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  });

  beforeEach(() => {
    // Mock environment variables
    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    Object.defineProperty(window, "localStorage", {
      value: stubWindowLocalStorage(),
      configurable: true,
      writable: true,
    });
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/",
        pathname: "/",
        search: "",
      },
      writable: true,
      configurable: true,
    });
    vi.mocked(generateAuthUrl).mockImplementation((...args) =>
      kindeReal.generateAuthUrl(...args),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses default redirect URL when not provided", async () => {
    mockStorage.getSessionItem
      .mockResolvedValueOnce("test-audience")
      .mockResolvedValueOnce("test-client");

    await act(async () => {
      render(
        <KindeProvider clientId="test" domain="test.com">
          <div>Test Child</div>
        </KindeProvider>,
      );
    });

    expect(window.location.origin).toBe("http://localhost:3000");
  });

  it("initializes the SDK after invitation login fails so children render", async () => {
    vi.mocked(generateAuthUrl).mockImplementation(() =>
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

    try {
      await waitFor(() => {
        expect(screen.getByText("Test Child")).toBeInTheDocument();
      });
    } finally {
      vi.mocked(generateAuthUrl).mockImplementation((...args) =>
        kindeReal.generateAuthUrl(...args),
      );
    }
  });
});
