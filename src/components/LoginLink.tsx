import React, { useEffect, useState } from "react";
import {
  LoginOptions,
  IssuerRouteTypes,
  generateAuthUrl,
  LoginMethodParams,
  generateRandomString,
} from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";

interface Props extends Partial<LoginMethodParams>, React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function LoginLink({ children, ...props }: Props) {
  const auth = useKindeAuth();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  console.log('render loginlink', props);
  

  useEffect(() => {
    let isMounted = true;
    const getAuthUrl = async (): Promise<{
      url: URL;
      state: string;
      nonce: string;
    }> => {
      const authProps: LoginOptions = {
        audience: (await auth.store.getSessionItem(
          LocalKeys.audience
        )) as string,
        clientId: (await auth.store.getSessionItem(
          LocalKeys.clientId
        )) as string,
        redirectURL: props.redirectURL || import.meta.env.VITE_KINDE_REDIRECT_URL || window.location.origin,
        prompt: "login",
        ...props,
      };
      const domain = (await auth.store.getSessionItem(
        LocalKeys.domain
      )) as string;

      authProps.audience = '';
      return generateAuthUrl(domain, IssuerRouteTypes.login, authProps);
    };

    getAuthUrl().then((url) => {
      if (isMounted) {
        setAuthUrl(url?.url.toString());
      }
    });

    return () => {
      isMounted = false;
    };
  }, [props]); // Only re-run when auth or props change

  return authUrl ? <button {...props} onClick={() => { document.location = authUrl; }}>{children}</button> : <></>;
}