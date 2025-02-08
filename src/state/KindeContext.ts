import { createContext } from "react";
import { initialState } from "./initialState";
import { State } from "./types";
import {
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
  refreshToken,
} from "@kinde/js-utils";
import { AuthOptions } from "./KindeProvider";

export interface KindeContextProps extends State {
  login: (options?: AuthOptions | LoginMethodParams) => Promise<void>;
  register: (options?: AuthOptions | LoginMethodParams) => Promise<void>;
  logout: (redirectUri: string) => Promise<void>;
  getClaims: () => Promise<ReturnType<typeof getClaims>>;
  getIdToken: () => Promise<string | undefined>;
  getToken: () => Promise<string | undefined>;
  getAccessToken: () => Promise<string | undefined>;
  getClaim: (
    ...args: Parameters<typeof getClaim>
  ) => Promise<ReturnType<typeof getClaim>>;
  getOrganization: () => Promise<ReturnType<typeof getCurrentOrganization>>;
  getCurrentOrganization: () => Promise<
    ReturnType<typeof getCurrentOrganization>
  >;
  getFlag: (
    ...args: Parameters<typeof getFlag>
  ) => Promise<ReturnType<typeof getFlag>>;

  getUserProfile: () => Promise<ReturnType<typeof getUserProfile>>;
  getPermission: (
    ...args: Parameters<typeof getPermission>
  ) => Promise<ReturnType<typeof getPermission>>;
  getPermissions: () => Promise<ReturnType<typeof getPermissions>>;
  getUserOrganizations: () => Promise<ReturnType<typeof getUserOrganizations>>;
  getRoles: () => Promise<ReturnType<typeof getRoles>>;
  refreshToken: (
    ...args: Parameters<typeof refreshToken>
  ) => Promise<ReturnType<typeof refreshToken>>;
}

const initialContext = {
  ...initialState,
};

export const KindeContext = createContext<KindeContextProps>(
  initialContext as KindeContextProps,
);
