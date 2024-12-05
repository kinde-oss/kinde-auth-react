import React, { useCallback } from "react";
import { LoginMethodParams } from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";

interface Props
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RegisterLink({ children, ...props }: Props) {
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
