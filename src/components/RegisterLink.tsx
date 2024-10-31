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

export function RegisterLink({ children, ...props }: Props) {
  const auth = useKindeAuth();

  const register = useCallback(async () => {
    const authProps: LoginOptions = {
      audience: (await auth.store.getSessionItem(LocalKeys.audience)) as string,
      clientId: (await auth.store.getSessionItem(LocalKeys.clientId)) as string,
      redirectURL:
        props.redirectURL ||
        import.meta.env.VITE_KINDE_REDIRECT_URL ||
        window.location.origin,
      prompt: "register",
      ...props,
    };
    const domain = (await auth.store.getSessionItem(
      LocalKeys.domain,
    )) as string;

    const authUrl = await generateAuthUrl(
      domain,
      IssuerRouteTypes.register,
      authProps,
    );
    document.location = authUrl.url.toString();
  }, []);

  return (
    <button {...props} onClick={() => register()}>
      {children}
    </button>
  );
}
