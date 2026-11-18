import { useState, useEffect, useRef } from "react";
import { useKindeAuth } from "../../hooks/useKindeAuth";
import { has, type AcrValue } from "@kinde/js-utils";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  has?: Parameters<typeof has>[0];
  /**
   * Authentication context the route requires: `mfa` or `phr` (passkey).
   * A signed-in user who doesn't meet it is sent through `stepUp`.
   */
  acr?: AcrValue;
  /** Maximum age, in seconds, of the user's last authentication. */
  maxAge?: number;
  fallbackPath?: string;
}

// Marks a step-up started by this route, so a failed or unmet step-up goes to
// `fallbackPath` instead of starting another one: Kinde's answer is final.
const STEP_UP_ATTEMPT_KEY = "kinde_protected_route_step_up";
const STEP_UP_ATTEMPT_TTL_MS = 10 * 60 * 1000;

const currentRoute = () =>
  `${window.location.pathname}${window.location.search}`;

const markStepUpAttempt = () => {
  try {
    window.sessionStorage.setItem(
      STEP_UP_ATTEMPT_KEY,
      JSON.stringify({ route: currentRoute(), at: Date.now() }),
    );
  } catch {
    // Storage unavailable: the guard is best effort.
  }
};

/** Whether this route already started a step-up recently. Clears the marker. */
const consumeStepUpAttempt = (): boolean => {
  try {
    const raw = window.sessionStorage.getItem(STEP_UP_ATTEMPT_KEY);
    window.sessionStorage.removeItem(STEP_UP_ATTEMPT_KEY);
    if (!raw) return false;
    const { route, at } = JSON.parse(raw);
    return route === currentRoute() && Date.now() - at < STEP_UP_ATTEMPT_TTL_MS;
  } catch {
    return false;
  }
};

const clearStepUpAttempt = () => {
  try {
    window.sessionStorage.removeItem(STEP_UP_ATTEMPT_KEY);
  } catch {
    // Storage unavailable.
  }
};

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
  acr,
  maxAge,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasAuthenticationContext, stepUp } =
    useKindeAuth();
  const [accessLoading, setAccessLoading] = useState(false);
  // Set once a step-up redirect starts, so re-renders don't check again.
  const stepUpStartedRef = useRef(false);
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
    const requiresContext = acr !== undefined || maxAge !== undefined;

    const checkAccess = async () => {
      if (stepUpStartedRef.current) return;
      if (!hasParams && !requiresContext) {
        setHasAccess(true);
        return;
      }

      setAccessLoading(true);
      try {
        if (hasParams && !(await has(hasParams))) {
          setHasAccess(false);
          return;
        }
        if (requiresContext) {
          const requirement = { acr, maxAge };
          if (await hasAuthenticationContext(requirement)) {
            clearStepUpAttempt();
          } else if (consumeStepUpAttempt()) {
            // Already stepped up from here and still not met: don't loop.
            setHasAccess(false);
            return;
          } else {
            markStepUpAttempt();
            stepUpStartedRef.current = true;
            // Redirects to Kinde; keep showing the loading state meanwhile.
            await stepUp(requirement);
            return;
          }
        }
        setHasAccess(true);
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
  }, [
    hasParams,
    acr,
    maxAge,
    isAuthenticated,
    hasAuthenticationContext,
    stepUp,
  ]);

  // Show loading while checking router availability or auth/access
  if (isRouterAvailable === null || isLoading || accessLoading) {
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
