import createKindeClient from "@kinde-oss/kinde-auth-pkce-js";
import { createContext } from "react";
import { initialState } from "./initialState";
import { State } from "./types";
import { MemoryStorage } from "@kinde/js-utils";
import { LocalKeys } from "./KindeProvider";

type KindeClient = Awaited<ReturnType<typeof createKindeClient>>;
export interface KindeContextProps extends State {
  login: KindeClient["login"];
  register: KindeClient["register"];
  logout: KindeClient["logout"];
  createOrg: KindeClient["createOrg"];
  getClaim: KindeClient["getClaim"];
  getFlag: KindeClient["getFlag"] | undefined;
  getBooleanFlag: KindeClient["getBooleanFlag"];
  getIntegerFlag: KindeClient["getIntegerFlag"];
  getStringFlag: KindeClient["getStringFlag"];
  getPermissions: KindeClient["getPermissions"] | undefined;
  getPermission: KindeClient["getPermission"] | undefined;
  getOrganization: KindeClient["getOrganization"] | undefined;
  getToken: KindeClient["getToken"] | undefined;
  getIdToken: KindeClient["getIdToken"];
  getUser: KindeClient["getUser"];
  getUserOrganizations: KindeClient["getUserOrganizations"];
  store: MemoryStorage<LocalKeys>;
}

const initialContext = {
  ...initialState,
};

export const KindeContext = createContext<KindeContextProps>(
  initialContext as KindeContextProps,
);
