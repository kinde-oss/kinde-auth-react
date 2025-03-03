import { LoginMethodParams, UserProfile } from "@kinde/js-utils";

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
}

export type ErrorProps = {
  error: string;
  errorDescription: string;
};
