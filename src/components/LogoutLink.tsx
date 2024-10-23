import React, { useMemo, useEffect, useState } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectUrl?: string;
}

export function LogoutLink({ children, ...props }: Props) {
  const auth = useKindeAuth();

  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const authUrlPromise = useMemo(() => {
    const getAuthUrl = async () => {
      const domain = (await auth.store.getSessionItem(
        LocalKeys.domain
      )) as string;

      const params = new URLSearchParams()
      if (props.redirectUrl) {
        params.append("redirect", props.redirectUrl)
      }

      return new URL(`${domain}/logout?${params.toString()}`);
    };
    return getAuthUrl();
  }, [auth, props]);

  useEffect(() => {
    let isMounted = true;

    authUrlPromise.then((url) => {
      if (isMounted) {
        setAuthUrl(url.toString());
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authUrlPromise]);

  return authUrl ? <button  {...props} onClick={() => { document.location = authUrl}}>{children}</button> : <></>;
}
