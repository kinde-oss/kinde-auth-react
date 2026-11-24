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

type StepUpMarker = { route: string; at: number };

const readMarker = (): StepUpMarker | null => {
  const raw = window.sessionStorage.getItem(STEP_UP_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const marker = JSON.parse(raw);
    if (typeof marker?.route === "string" && typeof marker?.at === "number") {
      return marker;
    }
  } catch {
    // Unreadable: treated as expired below.
  }
  return { route: "", at: 0 };
};

/**
 * Reads the step-up marker:
 * - `none`: no fresh marker (an expired or unreadable one is removed);
 * - `thisRoute`: this route already stepped up (the marker is removed);
 * - `otherRoute`: another route's step-up is outstanding (the marker is kept).
 */
const readStepUpAttempt = (): "none" | "thisRoute" | "otherRoute" => {
  try {
    const marker = readMarker();
    if (!marker) return "none";
    if (Date.now() - marker.at >= STEP_UP_ATTEMPT_TTL_MS) {
      window.sessionStorage.removeItem(STEP_UP_ATTEMPT_KEY);
      return "none";
    }
    if (marker.route !== currentRoute()) return "otherRoute";
    window.sessionStorage.removeItem(STEP_UP_ATTEMPT_KEY);
    return "thisRoute";
  } catch {
    return "none";
  }
};

/** Removes the marker only when it belongs to this route. */
const clearOwnStepUpAttempt = () => {
  try {
    if (readMarker()?.route === currentRoute()) {
      window.sessionStorage.removeItem(STEP_UP_ATTEMPT_KEY);
    }
  } catch {
    // Storage unavailable.
  }
};

// In an iframe, js-utils `navigateToKinde` opens a popup and resolves after
// the callback is handled on this page; otherwise the page navigates away.
// `location.href` can't tell them apart: it keeps the old URL until unload.
const stepUpRunsInPopup = () => window.self !== window.top;

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
  // Set while a step-up is in progress, so re-renders don't start another.
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
        // Optional for apps (a dev dependency here, for types and tests).
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
            clearOwnStepUpAttempt();
          } else {
            const attempt = readStepUpAttempt();
            if (attempt === "thisRoute") {
              // Already stepped up from here and still not met: don't loop.
              setHasAccess(false);
              return;
            }
            if (attempt === "otherRoute") {
              // Another route's step-up is outstanding: wait for its
              // onSuccess or onError to navigate.
              return;
            }

            markStepUpAttempt();
            stepUpStartedRef.current = true;
            try {
              await stepUp(requirement);
            } catch (error) {
              // Kinde never answered, so a later visit may try again.
              clearOwnStepUpAttempt();
              stepUpStartedRef.current = false;
              throw error;
            }
            if (!stepUpRunsInPopup()) {
              // Full-page redirect under way: keep showing the loading state.
              return;
            }

            stepUpStartedRef.current = false;
            if (!(await hasAuthenticationContext(requirement))) {
              // Keep the marker so a remount doesn't start another step-up.
              setHasAccess(false);
              return;
            }
            clearOwnStepUpAttempt();
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
