import React, { useMemo, useEffect, useState } from "react";

// Assuming these are correctly imported from your project
import { LoginOptions, IssuerRouteTypes, generateAuthUrl, LoginMethodParams } from '@kinde/js-utils'; 
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";

interface Props {
  children: React.ReactNode;
  authParams: Partial<LoginMethodParams>;
}

// export function LoginLink({ children, ...props }: Props) {
  export function LoginLink({ children, authParams }: Props) {
  const auth = useKindeAuth();

  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const authUrlPromise = useMemo(() => {

    const getAuthUrl = async () => {
      const authProps: LoginOptions = {
        audience: await auth.store.getSessionItem(LocalKeys.audience) as string, 
        clientId: await auth.store.getSessionItem(LocalKeys.clientId) as string,
        redirectURL: '',
        prompt: 'login',
        ...authParams,
      };
      const domain = await auth.store.getSessionItem(LocalKeys.domain) as string;
      return generateAuthUrl(domain, IssuerRouteTypes.login, authProps);
    };
    return getAuthUrl(); 
  }, [auth, authParams]);

  useEffect(() => {
    let isMounted = true; // Track if the component is still mounted

    authUrlPromise.then(url => {
      if (isMounted) {
        setAuthUrl(url.toString());
      }
    });

    return () => {
      isMounted = false; // Cleanup: set isMounted to false on unmount
    };
  }, [authUrlPromise]); // Run effect whenever authUrlPromise changes

  // Conditionally render the link to avoid errors
  return (
    authUrl ? (
      <a href={authUrl}>{children}</a> 
    ) : (
      <></>
    )
  );
}