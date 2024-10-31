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

interface Props
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function LoginLink({ children, ...props }: Props) {
  const auth = useKindeAuth();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    const getAudience = async () => {
      await auth.store.getSessionItem(LocalKeys.audience);
      const audFromStore = (await auth.store.getSessionItem(
        LocalKeys.audience
      )) as string;
      if (audFromStore !== audience) {
        setAudience(audFromStore);
      }
    };
    const getDomain = async () => {
      await auth.store.getSessionItem(LocalKeys.domain);
      const domainFromStore = (await auth.store.getSessionItem(
        LocalKeys.domain
      )) as string;
      if (domainFromStore !== domain) {
        setDomain(domainFromStore as string);
      }
    };
    const getClientId = async () => {
      await auth.store.getSessionItem(LocalKeys.clientId);
      const clientIdFromStore = (await auth.store.getSessionItem(
        LocalKeys.clientId
      )) as string;

      if (clientIdFromStore !== clientId) {
        setClientId(clientIdFromStore);
      }
    };
    getDomain();
    getAudience();
    getClientId();
  }, [auth.store, audience, clientId]);

  const authUrlPromise = useMemo(() => {
    const getAuthUrl = async () => {
      const authProps: LoginOptions = {
        audience: audience || "",
        clientId: clientId || "",
        redirectURL:
          props.redirectURL ||
          import.meta.env.VITE_KINDE_REDIRECT_URL ||
          window.location.origin,
        prompt: "login",
        ...props,
      };

      authProps.audience = "";
      authProps.codeChallenge = generateRandomString();
      authProps.codeChallengeMethod = "S256";
      return generateAuthUrl(domain!, IssuerRouteTypes.login, authProps);
    };
    return getAuthUrl();
  }, [audience, clientId, domain]);

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

  return authUrl ? (
    <button
      {...props}
      onClick={() => {
        document.location = authUrl;
      }}
    >
      {children}
    </button>
  ) : (
    <></>
  );
}
