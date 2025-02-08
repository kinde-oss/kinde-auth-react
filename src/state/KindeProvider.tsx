import { ErrorProps } from "@kinde-oss/kinde-auth-pkce-js";
import {
  exchangeAuthCode,
  generateAuthUrl,
  IssuerRouteTypes,
  LoginMethodParams,
  LoginOptions,
  Scopes,
  frameworkSettings,
  getClaim,
  getClaims,
  getFlag,
  getUserProfile,
  getPermission,
  refreshToken,
  storageSettings,
  checkAuth,
  PromptTypes,
  base64UrlEncode,
  StorageKeys,
  UserProfile,
  getActiveStorage,
} from "@kinde/js-utils";
import * as storeState from "./store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { KindeContext, KindeContextProps } from "./KindeContext";
import { getRedirectUrl } from "../utils/getRedirectUrl";
import packageJson from "../../package.json";
// TODO: need to look for old token store and convert.
storageSettings.keyPrefix = "";

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
  options: AuthOptions | LoginMethodParams | undefined,
): options is AuthOptions => {
  return (
    (options as AuthOptions).org_code !== undefined ||
    (options as AuthOptions).app_state !== undefined ||
    (options as AuthOptions).authUrlParams !== undefined
  );
};

enum AuthEvent {
  login = "login",
  logout = "logout",
  register = "register",
  tokenRefreshed = "tokenRefreshed",
}

type KindeCallbacks = {
  onSuccess?: (user: UserProfile, state?: Record<string, unknown>) => void;
  onError?: (props: ErrorProps, state?: Record<string, string>) => void;
  onEvent?: (event: AuthEvent, state: Record<string, unknown>) => void;
};

type KindeProviderProps = {
  audience?: string;
  children: React.ReactNode;
  clientId: string;
  domain: string;
  /** @deprecated use `useInsecureForRefreshToken` field instead */
  isDangerouslyUseLocalStorage?: boolean;
  /**
   * Use localstorage for refresh token.
   *
   * Note: This is not recommended for production use, as it is less secure.  Use custom domain and refresh token will have handled without localStorage automatically
   */
  useInsecureForRefreshToken?: boolean;
  logoutUri?: string;
  redirectUri: string;
  callbacks: KindeCallbacks;
  scope?: string;
};

const defaultCallbacks: KindeCallbacks = {
  onSuccess: defaultOnRedirectCallback,
};
type KindeState = { event: AuthEvent };

type StringProperties = {
  [P in string as P extends "kinde" ? never : P]: string;
};

// Combine types to create final state type
type StateWithKinde = StringProperties & {
  kinde: KindeState;
};

export const KindeProvider = ({
  audience,
  scope,
  clientId,
  children,
  domain,
  isDangerouslyUseLocalStorage = false,
  useInsecureForRefreshToken = false,
  redirectUri,
  callbacks = {},
  logoutUri,
}: KindeProviderProps) => {
  const mergedCallbacks = { ...defaultCallbacks, ...callbacks };

  frameworkSettings.framework = "react";
  frameworkSettings.frameworkVersion = React.version;
  frameworkSettings.sdkVersion = packageJson.version;

  storageSettings.useInsecureForRefreshToken = useInsecureForRefreshToken;

  const [state, setState] = useState({ isAuthenticated: false });
  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    await checkAuth({ domain, clientId });
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    let returnedState: StateWithKinde;
    let kindeState: KindeState;
    if (!params.has("code")) {
      try {
        const user = await getUserProfile();
        if (user) {
          setState((val) => ({ ...val, user, isAuthenticated: true }));
        }
      } catch (error) {
        console.warn("Error getting user profile", error);
      }
      return;
    } else {
      const decoded = atob(params.get("state") || "");

      returnedState = JSON.parse(decoded);
      kindeState = Object.assign(
        returnedState.kinde || { event: PromptTypes.login },
      );
    }

    const redirectURL = (await storeState.memoryStorage.getSessionItem(
      storeState.LocalKeys.redirectUri,
    )) as string;

    const codeResponse = await exchangeAuthCode({
      urlParams: new URLSearchParams(window.location.search),
      domain,
      clientId,
      redirectURL: getRedirectUrl(redirectURL || redirectUri),
      autoRefresh: true,
    });

    if (codeResponse.success) {
      const user = await getUserProfile();
      if (user) {
        mergedCallbacks.onSuccess?.(user, {
          ...returnedState,
          kinde: undefined,
        });
        mergedCallbacks.onEvent?.(kindeState.event, {
          ...returnedState,
          kinde: undefined,
        });
      }
      setState((val) => ({ ...val, user, isAuthenticated: true }));
    } else {
      mergedCallbacks.onError?.(
        {
          error: codeResponse.error,
        },
        returnedState,
      );
    }
  }, [clientId, domain]);

  useEffect(() => {
    const mounted = { current: true };

    if (mounted.current) {
      init();
    }

    return () => {
      mounted.current = false;
    };
  }, [init]);

  useEffect(() => {
    storeState.memoryStorage.setItems({
      [storeState.LocalKeys.domain]: domain,
      [storeState.LocalKeys.clientId]: clientId,
      [storeState.LocalKeys.audience]: audience,
      [storeState.LocalKeys.redirectUri]: redirectUri,
      [storeState.LocalKeys.logoutUri]: logoutUri,
    });
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

  const login = useCallback(
    async (
      options?:
        | AuthOptions
        | (LoginMethodParams & { state?: Record<string, string> }),
    ) => {
      if (isAuthOptions(options)) {
        console.log("isAuthOptions", options);
      } else {
        if (!options) {
          return;
        }

        const optionsState: Record<string, string> = options.state || {};

        delete options.state;

        const authProps: LoginOptions = {
          audience,
          clientId,
          ...options,
          state: base64UrlEncode(
            JSON.stringify({
              kinde: { event: AuthEvent.login },
              ...optionsState,
            }),
          ),
          redirectURL: getRedirectUrl(options.redirectURL || redirectUri),
        };

        const domain = (await storeState.memoryStorage.getSessionItem(
          storeState.LocalKeys.domain,
        )) as string;

        const authUrl = await generateAuthUrl(
          domain,
          IssuerRouteTypes.login,
          authProps,
        );
        document.location = authUrl.url.toString();
      }
    },
    [],
  );

  const register = useCallback(
    async (
      options?:
        | AuthOptions
        | (LoginMethodParams & { state?: Record<string, string> }),
    ) => {
      if (isAuthOptions(options)) {
        console.log("isAuthOptions", options);
      } else {
        if (!options) {
          return;
        }

        const optionsState: Record<string, string> = options.state || {};

        delete options.state;

        const authProps: LoginOptions = {
          ...options,
          state: base64UrlEncode(
            JSON.stringify({
              kinde: { event: AuthEvent.register },
              ...optionsState,
            }),
          ),
          audience: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.audience,
          )) as string,
          clientId: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.clientId,
          )) as string,
          redirectURL: getRedirectUrl(options?.redirectURL || redirectUri),
          prompt: PromptTypes.create,
        };
        const domain = (await storeState.memoryStorage.getSessionItem(
          storeState.LocalKeys.domain,
        )) as string;

        const authUrl = await generateAuthUrl(
          domain,
          IssuerRouteTypes.register,
          authProps,
        );
        document.location = authUrl.url.toString();
      }
    },
    [],
  );

  const logout = useCallback(async (redirectUrl: string) => {
    const domain = (await storeState.memoryStorage.getSessionItem(
      storeState.LocalKeys.domain,
    )) as string;

    const params = new URLSearchParams();
    if (redirectUrl) {
      params.append("redirect", redirectUrl);
    }

    setState((val) => {
      return { ...val, user: null, isAuthenticated: false };
    });

    document.location = `${domain}/logout?${params.toString()}`;
  }, []);

  const contextValue = useMemo((): KindeContextProps => {
    return {
      // Internal Methods
      login,
      logout,
      register,

      isLoading: false,

      getIdToken: async (): Promise<string | undefined> => {
        const storage = getActiveStorage();
        return (await storage?.getSessionItem(StorageKeys.idToken)) as string;
      },
      getAccessToken: async (): Promise<string | undefined> => {
        const storage = getActiveStorage();
        return (await storage?.getSessionItem(
          StorageKeys.accessToken,
        )) as string;
      },
      /** @deprecated use `getAccessToken` instead */
      getToken: async (): Promise<string | undefined> => {
        const storage = getActiveStorage();
        return (await storage?.getSessionItem(
          StorageKeys.accessToken,
        )) as string;
      },

      getClaim: async (
        ...args: Parameters<typeof getClaim>
      ): Promise<ReturnType<typeof getClaim>> => {
        const { getClaim } = await import("@kinde/js-utils");
        return getClaim(...args);
      },
      getClaims: async (
        ...args: Parameters<typeof getClaims>
      ): Promise<ReturnType<typeof getClaims>> => {
        const { getClaims } = await import("@kinde/js-utils");
        return getClaims(...args);
      },
      /** @deprecated use `getCurrentOrganization` instead */
      getOrganization: async (): Promise<
        ReturnType<typeof getCurrentOrganization>
      > => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return getCurrentOrganization();
      },
      getCurrentOrganization: async (): Promise<
        ReturnType<typeof getCurrentOrganization>
      > => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return getCurrentOrganization();
      },
      
      getFlag: async <T extends boolean | string | number>(
        ...args: Parameters<typeof getFlag<T>>
      ): Promise<ReturnType<typeof getFlag<T>>> => {
        const { getFlag } = await import("@kinde/js-utils");
        return getFlag<T>(...args);
      },

      getUserProfile: async (): Promise<ReturnType<typeof getUserProfile>> => {
        const { getUserProfile } = await import("@kinde/js-utils");
        return getUserProfile();
      },

      getPermission: async (
        ...args: Parameters<typeof getPermission>
      ): Promise<ReturnType<typeof getPermission>> => {
        const { getPermission } = await import("@kinde/js-utils");
        return getPermission(...args);
      },

      getPermissions: async (): Promise<ReturnType<typeof getPermissions>> => {
        const { getPermissions } = await import("@kinde/js-utils");
        return getPermissions();
      },
      getUserOrganizations: async (): Promise<
        ReturnType<typeof getUserOrganizations>
      > => {
        const { getUserOrganizations } = await import("@kinde/js-utils");
        return getUserOrganizations();
      },
      getRoles: async (): Promise<ReturnType<typeof getRoles>> => {
        const { getRoles } = await import("@kinde/js-utils");
        return getRoles();
      },

      refreshToken: async (
        ...args: Parameters<typeof refreshToken>
      ): Promise<ReturnType<typeof refreshToken>> => {
        const { refreshToken } = await import("@kinde/js-utils");
        return refreshToken(...args);
      },
      ...state,
    };
  }, [state]);

  return (
    initRef && (
      <KindeContext.Provider value={contextValue}>
        {children}
      </KindeContext.Provider>
    )
  );
};
