import React from "react";
import { useKindeAuth } from "../hooks/useKindeAuth";
import { StepUpLinkProps } from "../state/types";

export function StepUpLink({
  children,
  acr,
  maxAge,
  returnTo,
  onClick,
  ...props
}: StepUpLinkProps) {
  const auth = useKindeAuth();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    auth.stepUp({ acr, maxAge, returnTo }).catch((error) => {
      console.error("Step-up failed:", error);
    });
  };

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
