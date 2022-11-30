import React from 'react';

export declare function useKindeAuth(): State & KindeClient;
export declare function KindeProvider({
  children
}: {
  children: any;
}): React.Provider<State>;
export type KindeUser = {
  first_name: string | null;
  id: string | null;
  last_name: string | null;
  preferred_email: string | null;
  provided_id: string | null;
};
export type State = {
  user: KindeUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
};
export type KindeToken = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
};
export type KindeClient = {
  getToken: () => Promise<string | undefined>;
  getUser: () => Promise<KindeUser | undefined>;
  handleRedirectCallback: () => Promise<{kindeState: KindeToken} | undefined>;
  login: (options: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (options: any) => Promise<void>;
  createOrg: (options: any) => Promise<void>;
};
