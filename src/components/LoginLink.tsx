import React, { useCallback } from "react";
import {
  LoginOptions,
  IssuerRouteTypes,
  generateAuthUrl,
  LoginMethodParams,
} from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";

interface Props
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function LoginLink({ children, ...props }: Props) {
  const auth = useKindeAuth();

  const login = useCallback(async () => {
    const authProps: LoginOptions = {
      audience: (await auth.store.getSessionItem(LocalKeys.audience)) as string,
      clientId: (await auth.store.getSessionItem(LocalKeys.clientId)) as string,
      redirectURL:
        props.redirectURL ||
        import.meta.env.VITE_KINDE_REDIRECT_URL ||
        window.location.origin,
      prompt: "login",
      ...props,
    };
    const domain = (await auth.store.getSessionItem(
      LocalKeys.domain,
    )) as string;

    authProps.audience = "";
    const authUrl = await generateAuthUrl(
      domain,
      IssuerRouteTypes.login,
      authProps,
    );
    console.log(authUrl);
    console.log(authUrl.url.toString());
    document.location = authUrl.url.toString();
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



// challenge code: FgjLyi9lj5cap3px6C2RLCmoMz0W43fiYbwzO3YN9Lk
// code: c9V8GJ2RZz3V9LVMgQwN8GJwzrTsddn_6cSVmmwLEmQ.UWHcgtVV-ZpfosVLEQgbBYStK845byEBXsRn1Mvfl9M
// verifier: 4f70f3f63292ede91234ffdc332b305ad262eb3b65caa648872d7c1c