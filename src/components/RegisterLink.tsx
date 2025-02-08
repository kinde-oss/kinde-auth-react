import React, { useCallback } from "react";
import { LoginMethodParams } from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { RegisterLinkProps } from "../state/types";

export function RegisterLink({ children, ...props }: RegisterLinkProps) {
  const auth = useKindeAuth();

  const register = useCallback(async () => {
    auth.register(props as LoginMethodParams);
  }, []);

  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick && props.onClick(event);
        register();
      }}
    >
      {children}
    </button>
  );
}
