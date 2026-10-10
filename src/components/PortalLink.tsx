import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { PortalLinkProps } from "../state/types";

export function PortalLink({
  children,
  subNav,
  returnUrl,
  ...restProps
}: PortalLinkProps) {
  const auth = useKindeAuth();

  const viewProfile = useCallback(async () => {
    try {
      const generatedUrl = await auth.generatePortalUrl({
        subNav,
        returnUrl: returnUrl || window.location.href,
      });
      window.location.href = generatedUrl.url.toString();
    } catch (error) {
      console.error("Failed to generate portal URL:", error);
    }
  }, [auth, returnUrl, subNav]);

  return (
    <button
      type="button"
      {...restProps}
      onClick={async () => {
        await viewProfile();
      }}
    >
      {children}
    </button>
  );
}
