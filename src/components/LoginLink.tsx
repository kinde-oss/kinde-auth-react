import React, { useCallback } from "react";
import { LoginMethodParams } from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LoginLinkProps } from "../state/types";

export function LoginLink({ children, ...props }: LoginLinkProps) {
  const auth = useKindeAuth();

  const login = useCallback(async () => {
    auth.login(props as LoginMethodParams);
  }, [auth, props]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(event);
    }
    login();
  };

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
