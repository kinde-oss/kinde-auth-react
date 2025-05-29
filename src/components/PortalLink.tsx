import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { PortalLinkProps } from "../state/types";

export function PortalLink({ children, ...props }: PortalLinkProps) {
  const auth = useKindeAuth();

  const viewProfile = useCallback(async () => {
    const generatedUrl = await auth.generatePortalUrl({
      subNav: props.subNav,
      returnUrl: props.returnUrl || window.location.href,
    });
    window.location.href = generatedUrl.url.toString();
  }, [auth, props.returnUrl, props.subNav]);

  return (
    <button
      type="button"
      {...props}
      onClick={() => {
        viewProfile();
      }}
    >
      {children}
    </button>
  );
}
