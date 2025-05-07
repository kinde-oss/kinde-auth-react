import { useKindeAuth } from "./hooks/useKindeAuth";
import { KindeProvider } from "./state/KindeProvider";
import type { State } from "./state/types";
import type { KindeContextProps } from "./state/KindeContext";
import { LoginLink, LogoutLink, RegisterLink } from "./components";

// Main exports
export { useKindeAuth } from "./hooks/useKindeAuth";
export { KindeProvider } from "./state/KindeProvider";
export { LoginLink, LogoutLink, RegisterLink } from "./components";

// Type exports
export type { State } from "./state/types";
export type { KindeContextProps } from "./state/KindeContext";
export * from "./state/KindeContext";
export * from "./state/KindeProvider";
