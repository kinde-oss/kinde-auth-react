import {
  exchangeAuthCode,
  generateAuthUrl,
  frameworkSettings,
  getUserProfile,
  storageSettings,
  checkAuth,
  base64UrlEncode,
  PromptTypes,
  StorageKeys,
  IssuerRouteTypes,
  getActiveStorage,
} from "@kinde/js-utils";
import type {
  Permissions,
  refreshToken,
  PermissionAccess,
  UserProfile,
  LoginMethodParams,
  LoginOptions,
  getClaims,
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
import { ErrorProps } from "./types";
// TODO: need to look for old token store and convert.
storageSettings.keyPrefix = "";

const defaultOnRedirectCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

enum AuthEvent {
  login = "login",
  logout = "logout",
  register = "register",
  tokenRefreshed = "tokenRefreshed",
}

type KindeCallbacks = {
  onSuccess?: (
    user: UserProfile,
    state: Record<string, unknown>,
    context: KindeContextProps,
  ) => void;
  onError?: (
    props: ErrorProps,
    state: Record<string, string>,
    context: KindeContextProps,
  ) => void;
  onEvent?: (
    event: AuthEvent,
    state: Record<string, unknown>,
    context: KindeContextProps,
  ) => void;
};

type KindeProviderProps = {
  audience?: string;
  children: React.ReactNode;
  clientId: string;
  domain: string;
  /**
   * Use localstorage for refresh token.
   *
   * Note: This is not recommended for production use, as it is less secure.  Use custom domain and refresh token will have handled without localStorage automatically
   */
  useInsecureForRefreshToken?: boolean;
  logoutUri?: string;
  redirectUri: string;
  callbacks?: KindeCallbacks;
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

type ProviderState = {
  user?: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export const KindeProvider = ({
  audience,
  scope,
  clientId,
  children,
  domain,
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

  const [state, setState] = useState<ProviderState>({
    user: undefined,
    isAuthenticated: false,
    isLoading: true,
  });
  const initRef = useRef(false);

  useEffect(() => {
    storeState.memoryStorage.setItems({
      [storeState.LocalKeys.domain]: domain,
      [storeState.LocalKeys.clientId]: clientId,
      [storeState.LocalKeys.audience]: audience,
      [storeState.LocalKeys.redirectUri]: redirectUri,
      [storeState.LocalKeys.logoutUri]: logoutUri,
    });
    return;
  }, [audience, scope, clientId, domain, redirectUri, logoutUri]);

  const login = useCallback(
    async (
      options?: LoginMethodParams & { state?: Record<string, string> },
    ) => {
      if (!options) {
        return;
      }

      const optionsState: Record<string, string> = options.state || {};

      options.state = undefined;

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
    },
    [audience, clientId, redirectUri],
  );

  const register = useCallback(
    async (
      options?: LoginMethodParams & { state?: Record<string, string> },
    ) => {
      if (!options) {
        return;
      }

      const optionsState: Record<string, string> = options.state || {};

      options.state = undefined;

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

      try {
        const domain = (await storeState.memoryStorage.getSessionItem(
          storeState.LocalKeys.domain,
        )) as string;

        const authUrl = await generateAuthUrl(
          domain,
          IssuerRouteTypes.register,
          authProps,
        );
        document.location = authUrl.url.toString();
      } catch (error) {  
        console.error("Register error:", error);  
        mergedCallbacks.onError?.({ 
          error: "ERR_REGISTER", 
          errorDescription: String(error) 
        }, {}, contextValue);  
      } 
    },
    [redirectUri],
  );

  const logout = useCallback(async (redirectUrl?: string) => {
    try {
      const domain = (await storeState.memoryStorage.getSessionItem(
        storeState.LocalKeys.domain,
      )) as string;

      const params = new URLSearchParams();
      if (redirectUrl) {
        params.append("redirect", redirectUrl);
      }

      setState((val) => {
        return { ...val, user: undefined, isAuthenticated: false };
      });

      await Promise.all([
        storeState.memoryStorage.destroySession(),
        storeState.localStorage.destroySession(),
      ]);

      document.location = `${domain}/logout?${params.toString()}`;
    } catch (error) {  
      console.error("Logout error:", error);  
      mergedCallbacks.onError?.({ 
        error: "ERR_LOGOUT", 
        errorDescription: String(error) 
      }, {}, contextValue);  
    } 
  }, []);

  const contextValue = useMemo((): KindeContextProps => {
    return {
      // Internal Methods
      login,
      logout,
      register,

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

      getClaim: async <T, V = string | number | string[]>(
        keyName: keyof T,
      ): Promise<{ name: keyof T; value: V } | null> => {
        const { getClaim } = await import("@kinde/js-utils");
        return getClaim<T, V>(keyName);
      },
      getClaims: async <T = undefined,>(
        ...args: Parameters<typeof getClaims>
      ): Promise<T | null> => {
        const { getClaims } = await import("@kinde/js-utils");
        return getClaims<T>(...args);
      },
      /** @deprecated use `getCurrentOrganization` instead */
      getOrganization: async (): Promise<string | null> => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return await getCurrentOrganization();
      },
      getCurrentOrganization: async (): Promise<string | null> => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return await getCurrentOrganization();
      },
      getFlag: async <T = string | number | boolean,>(
        name: string,
      ): Promise<T | null> => {
        const { getFlag } = await import("@kinde/js-utils");
        return await getFlag<T>(name);
      },

      getUserProfile: async <T = undefined,>(): Promise<
        (UserProfile & T) | null
      > => {
        const { getUserProfile } = await import("@kinde/js-utils");
        return getUserProfile<T>();
      },

      getPermission: async <T = string,>(
        permissionKey: T,
      ): Promise<PermissionAccess> => {
        const { getPermission } = await import("@kinde/js-utils");
        return await getPermission(permissionKey);
      },

      getPermissions: async <T = string,>(): Promise<Permissions<T>> => {
        const { getPermissions } = await import("@kinde/js-utils");
        return getPermissions<T>();
      },
      getUserOrganizations: async (): Promise<string[] | null> => {
        const { getUserOrganizations } = await import("@kinde/js-utils");
        return await getUserOrganizations();
      },
      getRoles: async (): Promise<string[]> => {
        const { getRoles } = await import("@kinde/js-utils");
        return await getRoles();
      },

      refreshToken: async (
        ...args: Parameters<typeof refreshToken>
      ): ReturnType<typeof refreshToken> => {
        const { refreshToken } = await import("@kinde/js-utils");
        const result = await refreshToken(...args);
        return result;
      },
      ...state,
    };
  }, [state, login, logout, register]);

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
          setState((val: ProviderState) => ({
            ...val,
            user,
            isAuthenticated: true,
          }));
        }
      } catch (error) {
        console.warn("Error getting user profile", error);
      } finally {
        setState((val: ProviderState) => ({ ...val, isLoading: false }));
      }
      return;
    } else {
      const decoded = atob(params.get("state") || "");  
      
      try {  
        returnedState = JSON.parse(decoded);  
        kindeState = Object.assign(  
          returnedState.kinde || { event: PromptTypes.login },  
        );  
      } catch (error) {  
        console.error("Error parsing state:", error);  
        mergedCallbacks.onError?.(  
          {  
            error: "ERR_STATE_PARSE",  
            errorDescription: String(error),  
          },  
          {},  
          contextValue  
        );  
        returnedState = {} as StateWithKinde;  
        kindeState = { event: AuthEvent.login };  
      } finally {  
        setState((val: ProviderState) => ({ ...val, isLoading: false }));  
      }  
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
        setState((val) => ({ ...val, user, isAuthenticated: true }));
        mergedCallbacks.onSuccess?.(
          user,
          {
            ...returnedState,
            kinde: undefined,
          },
          contextValue,
        );
        mergedCallbacks.onEvent?.(
          kindeState.event,
          {
            ...returnedState,
            kinde: undefined,
          },
          contextValue,
        );
      }
    } else {
      mergedCallbacks.onError?.(
        {
          error: "ERR_CODE_EXCHANGE",
          errorDescription: codeResponse.error,
        },
        returnedState,
        contextValue,
      );
    }
    setState((val) => ({ ...val, isLoading: false }));
  }, [clientId, domain, redirectUri, mergedCallbacks, contextValue]);
  
  useEffect(() => {
    const mounted = { current: true };

    if (mounted.current) {
      init();
    }

    return () => {
      mounted.current = false;
    };
  }, [init]);

  return (
    initRef.current && (
      <KindeContext.Provider value={contextValue}>
        {children}
      </KindeContext.Provider>
    )
  );
};
