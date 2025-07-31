import { useState, useEffect } from "react";
import { useKindeAuth } from "../../hooks/useKindeAuth";
import { has } from "@kinde/js-utils";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  has?: Parameters<typeof has>[0];
  fallbackPath?: string;
}

// Fallback component when react-router-dom is not available
function ProtectedRouteFallback({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        color: "#666",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h3>Protected Route</h3>
      <p>This component requires react-router-dom to be installed.</p>
      <p>
        Please install it: <code>npm install react-router-dom</code>
      </p>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  has: hasParams,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useKindeAuth();
  const [accessLoading, setAccessLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [NavigateComponent, setNavigateComponent] =
    useState<React.ComponentType<{ to: string; replace?: boolean }> | null>(
      null,
    );
  const [isRouterAvailable, setIsRouterAvailable] = useState<boolean | null>(
    null,
  );

  // Dynamically import react-router-dom
  useEffect(() => {
    const loadRouter = async () => {
      try {
        // @ts-expect-error - react-router-dom is an optional dependency
        const { Navigate } = await import("react-router-dom");
        setNavigateComponent(() => Navigate);
        setIsRouterAvailable(true);
      } catch {
        console.warn(
          "react-router-dom is not available. ProtectedRoute will render a fallback.",
        );
        setIsRouterAvailable(false);
      }
    };

    loadRouter();
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      if (!hasParams) {
        setHasAccess(true);
        return;
      }

      setAccessLoading(true);
      try {
        const result = await has(hasParams);
        setHasAccess(result);
      } catch (error) {
        console.error("Access check failed:", error);
        setHasAccess(false);
      } finally {
        setAccessLoading(false);
      }
    };

    if (isAuthenticated) {
      checkAccess();
    }
  }, [hasParams, isAuthenticated]);

  // Show loading while checking router availability or auth/access
  if (isRouterAvailable === null || isLoading || accessLoading) {
    return <div>Loading...</div>;
  }

  // Show loading while checking router availability
  if (isRouterAvailable === null) {
    return <div>Loading...</div>;
  }

  // If react-router-dom is not available, show fallback
  if (isRouterAvailable === false) {
    return <ProtectedRouteFallback>{children}</ProtectedRouteFallback>;
  }

  if (!isAuthenticated) {
    return NavigateComponent ? (
      <NavigateComponent to={fallbackPath} replace />
    ) : (
      <div>Redirecting...</div>
    );
  }

  if (hasAccess === false) {
    return NavigateComponent ? (
      <NavigateComponent to={fallbackPath} replace />
    ) : (
      <div>Redirecting...</div>
    );
  }

  if (hasAccess === null) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
