import { createContext } from "react";
import { initialState } from "./initialState";
import { State } from "./types";
import type {
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

export interface KindeContextProps extends State {
  login: (options?: LoginMethodParams) => Promise<void>;
  register: (options?: LoginMethodParams) => Promise<void>;
  logout: (redirectUri?: string) => Promise<void>;
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
}

const initialContext = {
  ...initialState,
};

export const KindeContext = createContext<KindeContextProps>(
  initialContext as KindeContextProps,
);
