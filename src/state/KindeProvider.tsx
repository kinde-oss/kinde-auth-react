import createKindeClient, {
  AuthOptions,
  ClaimTokenKey,
  ErrorProps,
  GetTokenOptions,
  KindeFlagValueType,
  OrgOptions
} from '@kinde-oss/kinde-auth-pkce-js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import { version } from '../utils/version';
import { initialState } from './initialState';
import { KindeContext } from './KindeContext';
import { reducer } from './reducer';
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
  onRedirectCallback?: (
    user: KindeUser,
    state?: Record<string, unknown>
  ) => void;
  onErrorCallback?: (props: ErrorProps) => void;
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
  onErrorCallback,
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
          on_error_callback: onErrorCallback,
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
          const user = client?.getUser();
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

  const login = useCallback(
    (options?: AuthOptions) => client?.login(options) || Promise.resolve(),
    [client]
  );

  const register = useCallback(
    (options?: AuthOptions) => client?.register(options) || Promise.resolve(),
    [client]
  );

  const logout = useCallback(
    () => client?.logout() || Promise.resolve(),
    [client]
  );

  const getClaim = useCallback(
    (claim: string, tokenType?: ClaimTokenKey) =>
      client?.getClaim(claim, tokenType) || null,
    [client]
  );

  const getFlag = useCallback(
    (
      code: string,
      defaultValue?: KindeFlagValueType['s' | 'b' | 'i'],
      flagType?: 's' | 'b' | 'i'
    ) => client?.getFlag(code, defaultValue, flagType) || defaultValue,
    [client]
  );

  const getBooleanFlag = useCallback(
    (code: string, defaultValue?: boolean) =>
      client?.getBooleanFlag(code, defaultValue) || defaultValue || false,
    [client]
  );

  const getIntegerFlag = useCallback(
    (code: string, defaultValue: number) =>
      client?.getIntegerFlag(code, defaultValue) || defaultValue,
    [client]
  );

  const getStringFlag = useCallback(
    (code: string, defaultValue: string) =>
      client?.getStringFlag(code, defaultValue) || defaultValue,
    [client]
  );

  const getPermissions = useCallback(() => client?.getPermissions(), [client]);

  const getPermission = useCallback(
    (key: string) => client?.getPermission(key),
    [client]
  );

  const getOrganization = useCallback(
    () => client?.getOrganization(),
    [client]
  );

  const getUserOrganizations = useCallback(
    () => client?.getUserOrganizations(),
    [client]
  );

  const createOrg = useCallback(
    (options?: OrgOptions) => client?.createOrg(options) || Promise.resolve(),
    [client]
  );

  const getToken = useCallback(
    async (options: GetTokenOptions) => {
      let token;
      try {
        token = await client?.getToken(options);
      } catch (error) {
        throw console.error(error);
      }
      return token;
    },
    [client]
  );

  const getIdToken = useCallback(
    async (options: GetTokenOptions) => {
      let idToken;
      try {
        idToken = await client?.getIdToken(options);
      } catch (error) {
        throw console.error(error);
      }
      return idToken;
    },
    [client]
  );

  const getUser = useCallback(() => {
    return client?.getUser() || undefined;
  }, [client]);

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};
