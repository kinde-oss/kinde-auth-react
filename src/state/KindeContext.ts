import { createContext } from "react";
import { initialState } from "./initialState";
import { State } from "./types";
import { LoginMethodParams } from "@kinde/js-utils";
import { AuthOptions } from "./KindeProvider";

export interface KindeContextProps extends State {
  login: (options?: AuthOptions | LoginMethodParams) => Promise<void>;
  register: (options?: AuthOptions | LoginMethodParams) => Promise<void>;
  logout: (redirectUri: string) => Promise<void>;
  // createOrg: KindeClient["createOrg"];
  getClaims: () => Promise<unknown | null>;
  // getFlag: KindeClient["getFlag"] | undefined;
  // getBooleanFlag: KindeClient["getBooleanFlag"];
  // getIntegerFlag: KindeClient["getIntegerFlag"];
  // getStringFlag: KindeClient["getStringFlag"];
  // getPermissions: KindeClient["getPermissions"] | undefined;
  // getPermission: KindeClient["getPermission"] | undefined;
  // getOrganization: KindeClient["getOrganization"] | undefined;
  // getToken: KindeClient["getToken"] | undefined;
  // getIdToken: KindeClient["getIdToken"];
  // getUser: KindeClient["getUser"];
  // getUserOrganizations: KindeClient["getUserOrganizations"];
  // store: MemoryStorage<LocalKeys>;
}

const initialContext = {
  ...initialState,
};

export const KindeContext = createContext<KindeContextProps>(
  initialContext as KindeContextProps,
);
