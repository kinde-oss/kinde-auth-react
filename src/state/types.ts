import { GeneratePortalUrlParams, LoginMethodParams, UserProfile } from "@kinde/js-utils";

export type State = {
  user?: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
};

export interface LoginLinkProps
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface RegisterLinkProps
  extends Partial<LoginMethodParams>,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface LogoutLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectUrl?: string;
  allSessions?: boolean;
}

export interface PortalLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Partial<Omit<GeneratePortalUrlParams, "domain">> {
  children: React.ReactNode;
}

export type ErrorProps = {
  error: string;
  errorDescription: string;
};

export type LogoutOptions = {
  allSessions?: boolean;
  redirectUrl?: string;
};
