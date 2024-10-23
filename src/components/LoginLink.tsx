import React, { useMemo, useEffect, useState } from "react";
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
  const authUrlPromise = useMemo(() => {
    const getAuthUrl = async () => {
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

      authProps.audience = "";
      authProps.codeChallenge = generateRandomString();
      authProps.codeChallengeMethod = "S256";
      return generateAuthUrl(domain, IssuerRouteTypes.login, authProps);
    };
    return getAuthUrl();
  }, [auth, props]);

  useEffect(() => {
    let isMounted = true;

    authUrlPromise.then((url) => {
      if (isMounted) {
        setAuthUrl(url?.url.toString());
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authUrlPromise]);

  return authUrl ? <button {...props} onClick={() => { document.location = authUrl}}>{children}</button> : <></>;
}
