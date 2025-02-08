import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LogoutLinkProps } from "../state/types";

export function LogoutLink({ children, ...props }: LogoutLinkProps) {
  const auth = useKindeAuth();

  const logout = useCallback(async () => {
    auth.logout(props.redirectUrl || window.location.origin);
  }, []);

  return (
    <button
      {...props}
      onClick={() => {
        logout();
      }}
    >
      {children}
    </button>
  );
}
