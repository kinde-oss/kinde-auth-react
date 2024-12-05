import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react-hooks";
import { useKindeAuth } from "./useKindeAuth";
import { KindeContext } from "../state/KindeContext";
import React, { ReactNode } from "react";

describe("useKindeAuth", () => {
  afterEach(() => {
    cleanup();
  });

  const mockKindeContext = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: "123",
      email: "test@example.com",
      given_name: "Test",
      family_name: "User",
      picture: "https://example.com/avatar.jpg",
    },
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    register: () => Promise.resolve(),
    getToken: () => Promise.resolve("mock-token"),
    getPermissions: () => ["read:profile"],
    getClaim: (claim: string) => null,
    getClaims: () => Promise.resolve([]),
    getOrganization: () => ({ id: "org-123", name: "Test Org" }),
    getPermission: (permission: string) => false,
    getFlag: (flag: string) => null,
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <KindeContext.Provider value={mockKindeContext}>
      {children}
    </KindeContext.Provider>
  );

  it("returns the context when used within KindeProvider", () => {
    const { result } = renderHook(() => useKindeAuth(), { wrapper });
    expect(result.current).toEqual(mockKindeContext);
  });

  it("throws error when used outside KindeProvider", () => {
    // Create a wrapper with undefined context
    const emptyWrapper = ({ children }: { children: ReactNode }) => (
      <KindeContext.Provider value={undefined}>
        {children}
      </KindeContext.Provider>
    );

    const { result } = renderHook(() => useKindeAuth(), {
      wrapper: emptyWrapper,
    });
    expect(result.error).toEqual(
      Error("Oooops! useKindeAuth must be used within a KindeProvider"),
    );
  });
});
