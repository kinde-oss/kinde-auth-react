import { createContext } from "react";
import { LogoutOptions, State, StepUpParams } from "./types";
import type {
  AuthenticationContext,
  AuthenticationContextRequirement,
  getClaim,
  getClaims,
  getCurrentOrganization,
  getFlag,
  getPermission,
  getPermissions,
  getRoles,
  getUserOrganizations,
  getUserProfile,
  LoginMethodParams,
  OrgCode,
  refreshToken,
  GeneratePortalUrlParams,
  StepUpRequiredError,
  stepUpRequiredFromResponse,
} from "@kinde/js-utils";

export interface KindeContextProps extends State {
  login: (
    options?: LoginMethodParams & { state?: Record<string, string> },
  ) => Promise<void>;
  register: (
    options?: LoginMethodParams & { state?: Record<string, string> },
  ) => Promise<void>;
  logout: (options?: string | LogoutOptions) => Promise<void>;
  getClaims: typeof getClaims;
  getIdToken: () => Promise<string | undefined>;
  getToken: () => Promise<string | undefined>;
  getAccessToken: () => Promise<string | undefined>;
  getClaim: typeof getClaim;
  getOrganization: typeof getCurrentOrganization;
  getCurrentOrganization: typeof getCurrentOrganization;
  getFlag: typeof getFlag;
  getUserProfile: typeof getUserProfile;
  getPermission: typeof getPermission;
  getPermissions: typeof getPermissions;
  getUserOrganizations: typeof getUserOrganizations;
  getRoles: typeof getRoles;
  refreshToken: typeof refreshToken;
  generatePortalUrl: (
    options: Omit<GeneratePortalUrlParams, "domain">,
  ) => Promise<{ url: URL }>;
  switchOrg: (orgCode: OrgCode) => Promise<void>;
  /**
   * Asks Kinde for a stronger or more recent authentication, for example MFA
   * in the last 5 minutes. Kinde asks only for the missing factor.
   * Rejects when step-up is not supported, or the options are invalid.
   */
  stepUp: (options: StepUpParams) => Promise<void>;
  /** `acr`, `amr` and `auth_time` of the current session, or null when signed out. */
  getAuthenticationContext: () => Promise<AuthenticationContext | null>;
  /**
   * Whether the current session meets `requirement`. For UI decisions only:
   * APIs must check the verified access token themselves.
   */
  hasAuthenticationContext: (
    requirement: AuthenticationContextRequirement,
  ) => Promise<boolean>;
  /** Whether this Kinde environment advertises step-up support. */
  isStepUpSupported: () => Promise<boolean>;
  /**
   * Reacts to an API's RFC 9470 challenge (`401` with
   * `error="insufficient_user_authentication"`) by starting `stepUp` with the
   * `acr` and `maxAge` it asks for. Resolves `false`, and does nothing, for any
   * other response. Retry the request at most once after the step-up.
   */
  handleStepUpChallenge: (
    challenge:
      Parameters<typeof stepUpRequiredFromResponse>[0] | StepUpRequiredError,
    options?: Omit<StepUpParams, "acr" | "maxAge">,
  ) => Promise<boolean>;
}

export const KindeContext = createContext<KindeContextProps | null>(null);
