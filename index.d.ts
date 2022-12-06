import React from 'react';

type KindeUser = {
  given_name: string | null;
  id: string | null;
  family_name: string | null;
  email: string | null;
};

type KindeClientOptions = {
  audience?: string;
  clientId?: string;
  redirectUri: string;
  domain: string;
  isDangerouslyUseLocalStorage?: boolean;
  logoutUri?: string;
  scope?: string;
  children: React.ReactNode;
};

type State = {
  user: KindeUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
};

type KindeToken = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
};

type KindeClient = {
  getToken: () => Promise<string | undefined>;
  getUser: () => Promise<KindeUser | undefined>;
  handleRedirectCallback: () => Promise<{kindeState: KindeToken} | undefined>;
  login: (options: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (options: any) => Promise<void>;
  createOrg: (options: any) => Promise<void>;
  getClaim: (claim: string, tokenKey?: string) => any;
  getPermissions: () => KindePermissions;
  getPermission: (key: string) => KindePermission;
  getOrganization: () => KindeOrganization;
  getUserOrganizations: () => KindeOrganizations;
};

declare function useKindeAuth(): State & KindeClient;

declare function KindeProvider(
  options: KindeClientOptions
): React.Provider<State>;

export {useKindeAuth, KindeProvider};
