import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { KindeProvider } from "./KindeProvider";
import React from "react";

describe("KindeProvider", () => {
  const mockStorage = {
    getSessionItem: vi.fn(),
    setSessionItem: vi.fn(),
    removeSessionItem: vi.fn(),
  };

  beforeEach(() => {
    vi.mock("../utils/storage", () => ({
      createStorage: () => mockStorage,
    }));

    // Mock environment variables
    vi.stubEnv("VITE_KINDE_REDIRECT_URL", "http://localhost:3000");
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
      },
    });
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
});
