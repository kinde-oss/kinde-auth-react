import createKindeClient from '@kinde-oss/kinde-auth-pkce-js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import { initialState } from './initialState';
import { KindeContext } from './KindeContext';
import { reducer } from './reducer';
import { version } from '../utils/version';
import { KindeUser } from './types';

const defaultOnRedirectCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

type KindeProviderProps = {
  audience?: string;
  children: React.ReactNode;
  clientId?: string;
  domain: string;
  isDangerouslyUseLocalStorage?: boolean;
  logoutUri?: string;
  redirectUri: string;
  onRedirectCallback?: (user: KindeUser, state?: object) => void;
  scope?: string;
};
export const KindeProvider = ({
  audience,
  scope,
  clientId,
  children,
  domain,
  isDangerouslyUseLocalStorage = false,
  redirectUri,
  onRedirectCallback = defaultOnRedirectCallback,
  logoutUri
}: KindeProviderProps) => {
  const [client, setClient] =
    useState<Awaited<ReturnType<typeof createKindeClient>>>();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isSubscribed = true;
    try {
      const getClient = async () => {
        const kindeClient = await createKindeClient({
          audience,
          scope,
          client_id: clientId,
          domain,
          is_dangerously_use_local_storage: isDangerouslyUseLocalStorage,
          redirect_uri: redirectUri,
          logout_uri: logoutUri,
          on_redirect_callback: onRedirectCallback,
          _framework: 'React',
          _frameworkVersion: version
        });
        setClient(kindeClient);
      };

      void getClient();
    } catch (err) {
      console.error(err);
    }
    return () => {
      isSubscribed = false;
    };
  }, [
    audience,
    scope,
    clientId,
    domain,
    isDangerouslyUseLocalStorage,
    redirectUri,
    logoutUri
  ]);

  useEffect(() => {
    let isSubscribed = true;
    (() => {
      if (client && isSubscribed) {
        try {
          const user = client!.getUser();
          dispatch({ type: 'INITIALISED', user });
        } catch (error) {
          console.log(error);
          dispatch({ type: 'ERROR', error: 'login error' });
        }
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [client]);

  const login = useCallback((options: any) => client!.login(options), [client]);

  const register = useCallback(
    (options: any) => client!.register(options),
    [client]
  );

  const logout = useCallback(() => client!.logout(), [client]);

  const getClaim = useCallback(
    (claim: string, tokenType?: string) => client!.getClaim(claim, tokenType),
    [client]
  );

  const getFlag = useCallback(
    (code: string, defaultValue?: any, flagType?: 's' | 'b' | 'i') =>
      client!.getFlag(code, defaultValue, flagType),
    [client]
  );

  const getBooleanFlag = useCallback(
    (code: string, defaultValue?: any) =>
      client!.getBooleanFlag(code, defaultValue),
    [client]
  );

  const getIntegerFlag = useCallback(
    (code: string, defaultValue?: any) =>
      client!.getIntegerFlag(code, defaultValue),
    [client]
  );

  const getStringFlag = useCallback(
    (code: string, defaultValue?: any) =>
      client!.getStringFlag(code, defaultValue),
    [client]
  );

  const getPermissions = useCallback(() => client!.getPermissions(), [client]);

  const getPermission = useCallback(
    (key: string) => client!.getPermission(key),
    [client]
  );

  const getOrganization = useCallback(
    () => client!.getOrganization(),
    [client]
  );

  const getUserOrganizations = useCallback(
    () => client!.getUserOrganizations(),
    [client]
  );

  const createOrg = useCallback(
    (options: any) => client!.createOrg(options),
    [client]
  );

  const getToken = useCallback(async () => {
    let token;
    try {
      token = await client!.getToken();
    } catch (error) {
      throw console.error(error);
    }
    return token;
  }, [client]);

  const getIdToken = useCallback(async () => {
    let idToken;
    try {
      idToken = await client!.getIdToken();
    } catch (error) {
      throw console.error(error);
    }
    return idToken;
  }, [client]);

  const getUser = useCallback(
    () => client!.getUser(),
    [client]
  );

  const contextValue = useMemo(() => {
    return {
      ...state,
      getToken,
      getIdToken,
      login,
      register,
      logout,
      createOrg,
      getBooleanFlag,
      getClaim,
      getFlag,
      getIntegerFlag,
      getPermissions,
      getPermission,
      getOrganization,
      getStringFlag,
      getUserOrganizations,
      getUser
    };
  }, [
    state,
    getToken,
    getIdToken,
    login,
    register,
    logout,
    createOrg,
    getClaim,
    getPermissions,
    getPermission,
    getOrganization,
    getUserOrganizations,
    getUser
  ]);

  return (
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};
