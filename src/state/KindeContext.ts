import createKindeClient from '@kinde-oss/kinde-auth-pkce-js';
import { createContext } from 'react';
import { initialState } from './initialState';
import { State } from './types';

type KindeClient = Awaited<ReturnType<typeof createKindeClient>>;
export interface KindeContextProps extends State {
  login: KindeClient['login'];
  register: KindeClient['register'];
  logout: KindeClient['logout'];
  createOrg: KindeClient['createOrg'];
  getClaim: KindeClient['getClaim'];
  getFlag: KindeClient['getFlag'];
  getBooleanFlag: KindeClient['getBooleanFlag'];
  getIntegerFlag: KindeClient['getIntegerFlag'];
  getStringFlag: KindeClient['getStringFlag'];
  getPermissions: KindeClient['getPermissions'];
  getPermission: KindeClient['getPermission'];
  getOrganization: KindeClient['getOrganization'];
  getToken: KindeClient['getToken'];
  getIdToken: KindeClient['getIdToken'];
  getUser: KindeClient['getUser'];
  getUserOrganizations: KindeClient['getUserOrganizations'];
}

const initialContext = {
  ...initialState
};

export const KindeContext = createContext<KindeContextProps>(
  initialContext as KindeContextProps
);
