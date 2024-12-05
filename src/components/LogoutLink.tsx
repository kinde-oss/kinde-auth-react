import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LoginMethodParams } from "@kinde/js-utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectUrl?: string;
}

export function LogoutLink({ children, ...props }: Props) {
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
