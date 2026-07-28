import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { SwitchOrgLinkProps } from "../state/types";

export function SwitchOrgLink({ children, orgCode, ...props }: SwitchOrgLinkProps) {
  const auth = useKindeAuth();

  const switchOrg = useCallback(async () => {
    try {
      await auth.switchOrg(orgCode);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  }, [auth, orgCode]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(event);
    }
    switchOrg();
  };

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
