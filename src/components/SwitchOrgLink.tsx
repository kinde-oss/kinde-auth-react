import React, { useCallback } from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { SwitchOrgLinkProps } from "../state/types";

export function SwitchOrgLink({ children, orgCode, ...props }: SwitchOrgLinkProps) {
  const auth = useKindeAuth();

  const handleSwitchOrg = useCallback(async () => {
    try {
      await auth.switchOrg(orgCode);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  }, [auth, orgCode]);

  return (
    <button
      type="button"
      {...props}
      onClick={async () => {
        await handleSwitchOrg();
      }}
    >
      {children}
    </button>
  );
}
