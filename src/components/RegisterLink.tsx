import React, { useMemo, useEffect, useState } from "react";
import {
  LoginOptions,
  IssuerRouteTypes,
  generateAuthUrl,
  LoginMethodParams,
} from "@kinde/js-utils";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";
import { url } from "inspector";

interface Props extends Partial<LoginMethodParams>, React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RegisterLink({ children, ...props }: Props) {
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
        redirectURL: "",
        prompt: "register",
        ...props,
      };
      const domain = (await auth.store.getSessionItem(
        LocalKeys.domain
      )) as string;

      return generateAuthUrl(domain, IssuerRouteTypes.register, authProps);
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

  return authUrl ? <button  {...props} onClick={() => { document.location = authUrl}}>{children}</button> : <></>;
}
