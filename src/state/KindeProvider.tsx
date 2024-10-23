import createKindeClient, {
  ErrorProps,
  GetTokenOptions,
  KindeFlagValueType,
  OrgOptions,
} from "@kinde-oss/kinde-auth-pkce-js";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { version } from "../utils/version";
import { initialState } from "./initialState";
import { KindeContext } from "./KindeContext";
import { reducer } from "./reducer";
import { KindeUser } from "./types";
import {
  IssuerRouteTypes,
  LoginOptions,
  MemoryStorage,
  Scopes,
  generateAuthUrl,
  getClaim,
} from "@kinde/js-utils";

const defaultOnRedirectCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

export type AuthOptions = {
  /** @deprecated use `orgCode` field instead */
  org_code?: string;
  /** @deprecated TODO: deprecated message */
  app_state?: Record<string, unknown>;
  /** @deprecated TODO: deprecated message */
  authUrlParams?: {
    audience?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    connectionId?: string;
    hasSuccessPage?: boolean;
    isCreateOrg?: boolean;
    lang?: string;
    loginHint?: string;
    nonce?: string;
    orgCode?: string;
    orgName?: string;
    responseType?: string;
    scope?: Scopes[];
    state?: string;
  };
};

const isAuthOptions = (
  options: AuthOptions | LoginOptions | undefined
): options is AuthOptions => {
  return (
    (options as AuthOptions).org_code !== undefined ||
    (options as AuthOptions).app_state !== undefined ||
    (options as AuthOptions).authUrlParams !== undefined
  );
};

type KindeProviderProps = {
  audience?: string;
  children: React.ReactNode;
  clientId: string;
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

export enum LocalKeys {
  domain = "domain",
  clientId = "client_id",
  audience = "audience",
  redirectUri = "redirect_uri",
  logoutUri = "logout_uri",
}

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
  logoutUri,
}: KindeProviderProps) => {
  /// TODO: Switch out dev mode for local storage
  const [store] = useState(
    !process.env.NODE_ENV || process.env.NODE_ENV === "development"
      ? new MemoryStorage<LocalKeys>()
      : new MemoryStorage<LocalKeys>()
  );

  const [client, setClient] =
    useState<Awaited<ReturnType<typeof createKindeClient>>>();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Promise.all([
      store.setSessionItem(LocalKeys.domain, domain),
      store.setSessionItem(LocalKeys.clientId, clientId),
      store.setSessionItem(LocalKeys.audience, audience),
      store.setSessionItem(LocalKeys.redirectUri, redirectUri),
      store.setSessionItem(LocalKeys.logoutUri, logoutUri),
    ]);

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
          _framework: "React",
          _frameworkVersion: version,
        });
        setClient(kindeClient);
      };

      void getClient();
    } catch (err) {
      console.error(err);
    }
    return;
  }, [
    audience,
    scope,
    clientId,
    domain,
    isDangerouslyUseLocalStorage,
    redirectUri,
    logoutUri,
  ]);

  useEffect(() => {
    let isSubscribed = true;
    (() => {
      if (client && isSubscribed) {
        try {
          const user = client?.getUser();
          dispatch({ type: "INITIALISED", user });
        } catch (error) {
          console.log(error);
          dispatch({ type: "ERROR", error: "login error" });
        }
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [client]);

  const login = useCallback((options?: AuthOptions | LoginOptions) => {
    let cleanedOptions: LoginOptions = {
      clientId: clientId,
      audience,
      prompt: "login",
      redirectURL: redirectUri,
    };
    if (isAuthOptions(options)) {
      if ("org_code" in options) cleanedOptions.orgCode = options.org_code;
      if ("authUrlParams" in options && options.authUrlParams) {
        cleanedOptions = {
          ...cleanedOptions,
          ...options,
        };
      }
    }
    window.location.href = generateAuthUrl(
      domain,
      IssuerRouteTypes.login,
      cleanedOptions
    ).url.toString();
  }, []);

  const register = useCallback((options?: AuthOptions | LoginOptions) => {
    let cleanedOptions: LoginOptions = {
      clientId: clientId,
      audience,
      prompt: "register",
      redirectURL: redirectUri,
    };
    if (isAuthOptions(options)) {
      if ("org_code" in options) cleanedOptions.orgCode = options.org_code;
      if ("authUrlParams" in options && options.authUrlParams) {
        cleanedOptions = {
          ...cleanedOptions,
          ...options,
        };
      }
    }
    window.location.href = generateAuthUrl(
      domain,
      IssuerRouteTypes.register,
      cleanedOptions
    ).url.toString();
  }, []);

  const logout = useCallback(
    () => client?.logout() || Promise.resolve(),
    [client]
  );

  const getFlag = useCallback(
    (
      code: string,
      defaultValue?: KindeFlagValueType["s" | "b" | "i"],
      flagType?: "s" | "b" | "i"
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
      getUser,
      store,
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
    getUser,
    store,
  ]);

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};
