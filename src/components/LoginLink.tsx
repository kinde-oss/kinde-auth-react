import React, { useCallback } from "react";
import { LoginMethodParams } from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LoginLinkProps } from "../state/types";

export function LoginLink({ children, ...props }: LoginLinkProps) {
  const auth = useKindeAuth();

  const login = useCallback(async () => {
    auth.login(props as LoginMethodParams);
  }, []);

  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick && props.onClick(event);
        login();
      }}
    >
      {children}
    </button>
  );
}
