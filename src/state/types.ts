import {
  AcrValue,
  GeneratePortalUrlParams,
  LoginMethodParams,
  OrgCode,
  UserProfile,
} from "@kinde/js-utils";

export enum TimeoutActivityType {
  preWarning = "preWarning",
  timeout = "timeout",
}

export type State = {
  user?: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
};

export interface LoginLinkProps
  extends
    Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface RegisterLinkProps
  extends
    Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface LogoutLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectUrl?: string;
  allSessions?: boolean;
}

export interface PortalLinkProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    Partial<Omit<GeneratePortalUrlParams, "domain">> {
  children: React.ReactNode;
}

export interface StepUpLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Authentication context to require: `mfa` or `phr` (passkey). */
  acr?: AcrValue;
  /** Maximum age, in seconds, of the user's last authentication. */
  maxAge?: number;
  /** Same-origin path to return to. Defaults to the current location. */
  returnTo?: string;
}

export interface SwitchOrgLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  orgCode: OrgCode;
}

export type ErrorProps = {
  error: string;
  errorDescription: string;
  /**
   * The typed error behind this callback, when there is one.
   * For `unmet_authentication_requirements` this is an
   * `UnmetAuthenticationRequirementsError`; for `login_required` a
   * `LoginRequiredError`. Both carry `state`, `acr` and `maxAge`.
   */
  cause?: Error;
};

/**
 * Options for `stepUp`. Any other login option can be passed as well.
 * `acr` or `maxAge` is required.
 */
export type StepUpParams = Omit<LoginMethodParams, "acrValues" | "maxAge"> & {
  /** Authentication context to require: `mfa` or `phr` (passkey). */
  acr?: AcrValue;
  /** Maximum age, in seconds, of the user's last authentication. `0` is valid. */
  maxAge?: number;
  /**
   * Same-origin path to return to after the step-up. Defaults to the current
   * location. Passed to `onSuccess` and `onError` as `state.returnTo`.
   */
  returnTo?: string;
  state?: Record<string, string>;
};

export type LogoutOptions = {
  allSessions?: boolean;
  redirectUrl?: string;
};

export type PopupOptions = {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
};

/**
 * Activity timeout configuration.
 * ⚠️ Must be memoized or defined outside component to prevent effect re-runs.
 * @example
 * const config = useMemo(() => ({ timeoutMinutes: 30 }), []);
 * <KindeProvider activityTimeout={config} ... />
 */
export type ActivityTimeoutConfig = {
  timeoutMinutes: number;
  preWarningMinutes?: number;
  onTimeout?: (type: TimeoutActivityType) => void | Promise<void>;
};
