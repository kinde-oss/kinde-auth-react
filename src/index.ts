export { useKindeAuth } from "./hooks/useKindeAuth";
export { KindeProvider } from "./state/KindeProvider";

// Type exports
export type {
  State,
  ActivityTimeoutConfig,
  ErrorProps,
  StepUpParams,
  StepUpLinkProps,
} from "./state/types";
export { TimeoutActivityType } from "./state/types";
// js-utils is bundled into this package, so apps must use these copies for
// `instanceof` checks against errors the SDK reports.
export {
  UnmetAuthenticationRequirementsError,
  LoginRequiredError,
  StepUpRequiredError,
  parseStepUpChallenge,
  stepUpRequiredFromResponse,
} from "@kinde/js-utils";
export type {
  AcrValue,
  AuthenticationContext,
  AuthenticationContextRequirement,
} from "@kinde/js-utils";
export * from "./state/KindeContext";
export * from "./state/KindeProvider";
