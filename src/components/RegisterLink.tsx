import React, { useCallback } from "react";
import { LoginMethodParams } from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { RegisterLinkProps } from "../state/types";

export function RegisterLink({ children, ...props }: RegisterLinkProps) {
  const auth = useKindeAuth();

  const register = useCallback(async () => {
    auth.register(props as LoginMethodParams);
  }, [auth, props]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(event);
    }
    register();
  };

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
