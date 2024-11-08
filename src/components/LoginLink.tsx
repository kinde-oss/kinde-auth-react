import React, { useCallback } from "react";
import { LoginMethodParams} from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";

interface Props
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function LoginLink({ children, ...props }: Props) {
  const auth = useKindeAuth();

  const login = useCallback(async () => {
   auth.login(props as LoginMethodParams);
  }, []);

  return (
    <button
      {...props}
      onClick={() => {
        login();
      }}
    >
      {children}
    </button>
  );
}