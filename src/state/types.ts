import { LoginMethodParams } from "@kinde/js-utils";

export type KindeUser = {
  given_name: string | null;
  id: string | null;
  family_name: string | null;
  email: string | null;
  picture: string | null;
};

export type State = {
  user?: KindeUser;
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
