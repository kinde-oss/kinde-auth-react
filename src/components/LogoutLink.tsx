import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { LocalKeys } from "../state/KindeProvider";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectUrl?: string;
}

export function LogoutLink({ children, ...props }: Props) {
  const auth = useKindeAuth();

  const logout = useCallback(async () => {
    const domain = (await auth.store.getSessionItem(
      LocalKeys.domain,
    )) as string;

    const params = new URLSearchParams();
    if (props.redirectUrl) {
      params.append("redirect", props.redirectUrl);
    }
    document.location = `${domain}/logout?${params.toString()}`;
  },[])
  
  return (
    <button {...props}
      onClick={() => {
       logout();
      }}
    >
      {children}
    </button>
  )
}
