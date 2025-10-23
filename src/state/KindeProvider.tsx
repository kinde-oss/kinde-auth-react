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
  Permissions,
  refreshToken,
  PermissionAccess,
  UserProfile,
  LoginMethodParams,
  LoginOptions,
  getClaims,
  getClaim,
  getCurrentOrganization,
  getFlag,
  getPermission,
  getPermissions,
  getUserOrganizations,
  getRoles,
  generatePortalUrl,
  Role,
  GeneratePortalUrlParams,
  navigateToKinde,
  setActiveStorage,
  isAuthenticated,
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
import { ErrorProps, LogoutOptions, PopupOptions } from "./types";
import type {
  RefreshTokenResult,
  Scopes,
  SessionManager,
} from "@kinde/js-utils";
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

type EventTypes = {
  (
    event: AuthEvent.tokenRefreshed,
    state: RefreshTokenResult,
    context: KindeContextProps,
  ): void;
  (
    event: AuthEvent,
    state: Record<string, unknown>,
    context: KindeContextProps,
  ): void;
};

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
  onEvent?: EventTypes;
};

type KindeProviderProps = {
  audience?: string;
  children: React.ReactNode;
  clientId: string;
  domain: string;
  authorizationEndpoint?: string;
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
  forceChildrenRender?: boolean;
  /**
   * When the application is shown in an iFrame, auth will open in a popup window.
   * This is the options for the popup window.
   */
  popupOptions?: PopupOptions;
  store?: SessionManager;
  refreshOnFocus?: boolean
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
  authorizationEndpoint,
  useInsecureForRefreshToken = false,
  redirectUri,
  callbacks = {},
  logoutUri,
  forceChildrenRender = false,
  popupOptions = {},
  store = storeState.memoryStorage,
  refreshOnFocus = false,
}: KindeProviderProps) => {
  const mergedCallbacks = { ...defaultCallbacks, ...callbacks };

  useEffect(() => {
    setActiveStorage(store);
    const unsubscribe = store.subscribe(async () => {
      try {
        const [authenticated, user] = await Promise.all([
          isAuthenticated(),
          getUserProfile(),
        ]);

        if (authenticated && user) {
          setState((val) => ({ ...val, user, isAuthenticated: true }));
        } else {
          setState((val) => ({
            ...val,
            user: undefined,
            isAuthenticated: false,
          }));
        }
      } catch (error) {
        console.error("Store subscription update failed:", error);
        setState((val) => ({
          ...val,
          user: undefined,
          isAuthenticated: false,
        }));
      }
    });
    return unsubscribe;
  }, [store]);

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

  /**
   * Helper function to construct the final auth URL with optional custom authorization endpoint
   */
  const buildAuthUrl = useCallback((authUrl: { url: URL }): string => {
    if (!authorizationEndpoint) {
      return authUrl.url.toString();
    }

    const customUrl = new URL(authUrl.url.toString());
    // Ensure it's a path, not a full URL
    customUrl.pathname = authorizationEndpoint.startsWith("/")
      ? authorizationEndpoint
      : `/${authorizationEndpoint}`;
    
    return customUrl.toString();
  }, [authorizationEndpoint]);

  const login = useCallback(
    async (
      options: LoginMethodParams & { state?: Record<string, string> } = {},
    ) => {
      const optionsState: Record<string, string> = options.state || {};

      options.state = undefined;

      const authProps: LoginOptions = {
        audience,
        clientId,
        ...options,
        supportsReauth: true,
        scope: scope?.split(" ") as Scopes[],
        state: base64UrlEncode(
          JSON.stringify({
            kinde: { event: AuthEvent.login },
            ...optionsState,
          }),
        ),
        redirectURL: getRedirectUrl(options.redirectURL || redirectUri),
      };

      const authUrl = await generateAuthUrl(
        domain,
        IssuerRouteTypes.login,
        authProps,
      );

      const finalAuthUrl = buildAuthUrl(authUrl);

      try {
        navigateToKinde({
          url: finalAuthUrl,
          popupOptions,
          handleResult: processAuthResult,
        });
      } catch (error) {
        mergedCallbacks.onError?.(
          {
            error: "ERR_POPUP",
            errorDescription: (error as Error).message,
          },
          {},
          {} as KindeContextProps,
        );
      }
    },
    [audience, clientId, redirectUri, popupOptions, mergedCallbacks, domain, scope, buildAuthUrl],
  );

  const register = useCallback(
    async (
      options: LoginMethodParams & { state?: Record<string, string> } = {},
    ) => {
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
        supportsReauth: true,
        audience,
        clientId,
        redirectURL: getRedirectUrl(options?.redirectURL || redirectUri),
        prompt: PromptTypes.create,
      };

      try {
        const authUrl = await generateAuthUrl(
          domain,
          IssuerRouteTypes.register,
          authProps,
        );
        
        const finalAuthUrl = buildAuthUrl(authUrl);
        
        try {
          navigateToKinde({
            url: finalAuthUrl,
            popupOptions,
            handleResult: processAuthResult,
          });
        } catch (error) {
          mergedCallbacks.onError?.(
            {
              error: "ERR_POPUP",
              errorDescription: (error as Error).message,
            },
            {},
            {} as KindeContextProps,
          );
        }
      } catch (error) {
        console.error("Register error:", error);
        mergedCallbacks.onError?.(
          {
            error: "ERR_REGISTER",
            errorDescription: String(error),
          },
          {},
          contextValue,
        );
      }
    },
    [redirectUri, popupOptions, mergedCallbacks, audience, clientId, domain, buildAuthUrl],
  );

  const logout = useCallback(
    async (options?: string | LogoutOptions) => {
      try {
        const params = new URLSearchParams();

        if (options) {
          if (options && typeof options === "string") {
            params.append("redirect", options);
          } else if (typeof options === "object") {
            if (options.redirectUrl || logoutUri) {
              params.append("redirect", options.redirectUrl || logoutUri || "");
            }
            if (options.allSessions) {
              params.append("all_sessions", String(options.allSessions));
            }
          }
        } else {
          params.append("redirect", logoutUri || "");
        }

        await Promise.all([
          store.removeSessionItem(StorageKeys.idToken),
          store.removeSessionItem(StorageKeys.accessToken),
          store.removeSessionItem(StorageKeys.refreshToken),
          storeState.localStorage.removeSessionItem(StorageKeys.refreshToken),
        ]);

        setState((val) => {
          return { ...val, user: undefined, isAuthenticated: false };
        });

        await storeState.localStorage.setSessionItem(
          storeState.LocalKeys.performingLogout,
          "true",
        );

        try {
          await navigateToKinde({
            url: `${domain}/logout?${params.toString()}`,
            popupOptions,
          });
        } catch (error) {
          mergedCallbacks.onError?.(
            {
              error: "ERR_POPUP",
              errorDescription: (error as Error).message,
            },
            {},
            {} as KindeContextProps,
          );
        }
      } catch (error) {
        console.error("Logout error:", error);
        mergedCallbacks.onError?.(
          {
            error: "ERR_LOGOUT",
            errorDescription: String(error),
          },
          {},
          contextValue,
        );
      }
    },
    [store, popupOptions, mergedCallbacks, logoutUri, domain],
  );

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
        tokenType?: "accessToken" | "idToken",
      ): Promise<{ name: keyof T; value: V } | null> => {
        return getClaim<T, V>(keyName, tokenType);
      },
      getClaims: async <T = undefined,>(
        ...args: Parameters<typeof getClaims>
      ): Promise<T | null> => {
        return getClaims<T>(...args);
      },
      /** @deprecated use `getCurrentOrganization` instead */
      getOrganization: async (): Promise<string | null> => {
        return await getCurrentOrganization();
      },
      getCurrentOrganization: async (): Promise<string | null> => {
        return await getCurrentOrganization();
      },
      getFlag: async <T = string | number | boolean,>(
        name: string,
      ): Promise<T | null> => {
        return await getFlag<T>(name);
      },

      getUserProfile: async <T = undefined,>(): Promise<
        (UserProfile & T) | null
      > => {
        return getUserProfile<T>();
      },

      getPermission: async <T = string,>(
        permissionKey: T,
      ): Promise<PermissionAccess> => {
        return await getPermission(permissionKey);
      },

      getPermissions: async <T = string,>(): Promise<Permissions<T>> => {
        return getPermissions<T>();
      },
      getUserOrganizations: async (): Promise<string[] | null> => {
        return await getUserOrganizations();
      },
      getRoles: async (): Promise<Role[]> => {
        return await getRoles();
      },
      generatePortalUrl: async (
        options: Omit<GeneratePortalUrlParams, "domain">,
      ): Promise<{ url: URL }> => {
        return await generatePortalUrl({
          domain,
          returnUrl: options.returnUrl || window.location.href,
          subNav: options.subNav,
        });
      },
      refreshToken: async (
        ...args: Parameters<typeof refreshToken>
      ): ReturnType<typeof refreshToken> => {
        const result = await refreshToken(...args);
        return result;
      },
      ...state,
    };
  }, [state, login, logout, register]);

  const onRefresh = useCallback(
    (data: RefreshTokenResult): void => {
      if (mergedCallbacks.onEvent) {
        mergedCallbacks.onEvent(AuthEvent.tokenRefreshed, data, contextValue);
      }
    },
    [mergedCallbacks, contextValue],
  );

  // Function to process authentication result from popup
  const processAuthResult = useCallback(
    async (searchParams: URLSearchParams) => {
      const decoded = atob(searchParams.get("state") || "");
      let returnedState: StateWithKinde;
      let kindeState: KindeState;
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
          contextValue,
        );
        returnedState = {} as StateWithKinde;
        kindeState = { event: AuthEvent.login };
      }
      try {
        const codeResponse = await exchangeAuthCode({
          urlParams: searchParams,
          domain,
          clientId,
          redirectURL: getRedirectUrl(redirectUri),
          autoRefresh: true,
          onRefresh,
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
            if (mergedCallbacks.onEvent) {
              mergedCallbacks.onEvent(
                kindeState.event,
                {
                  ...returnedState,
                  kinde: undefined,
                },
                contextValue,
              );
            }
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
      } catch (error) {
        mergedCallbacks.onError?.(
          {
            error: "ERR_POPUP_AUTH",
            errorDescription: String(error),
          },
          returnedState,
          contextValue,
        );
      } finally {
        setState((val) => ({ ...val, isLoading: false }));
      }
    },
    [domain, clientId, redirectUri, onRefresh, mergedCallbacks, contextValue],
  );

  const handleFocus = useCallback(() => {
    if (document.visibilityState === "visible" && state.isAuthenticated && refreshOnFocus) {
      refreshToken({ domain, clientId, onRefresh }).catch((error) => {
        console.error("Error refreshing token:", error);
      });
    }
  }, [state.isAuthenticated, domain, clientId, onRefresh, refreshOnFocus]);

  useEffect(() => {
    // remove any existing event listener before adding a new one

    document.removeEventListener("visibilitychange", handleFocus);
    if (refreshOnFocus) {
    document.addEventListener("visibilitychange", handleFocus);
      return () => {
        document.removeEventListener("visibilitychange", handleFocus);
      };
    }
  }, [handleFocus, refreshOnFocus]);

  const init = useCallback(async () => {
    if (initRef.current) return;
    try {
      try {
        initRef.current = true;
        await checkAuth({ domain, clientId });
      } catch (err) {
        console.warn("checkAuth failed:", err);
        setState((v: ProviderState) => ({ ...v, isLoading: false }));
      }
      const params = new URLSearchParams(window.location.search);

      if (params.has("error")) {
        const errorCode = params.get("error");
        if (errorCode?.toLowerCase() === "login_link_expired") {
          const reauthState = params.get("reauth_state");
          if (reauthState) {
            login({ reauthState: reauthState });
          }
          return;
        }
        setState((val: ProviderState) => ({ ...val, isLoading: false }));
        return;
      }

      if (
        (await storeState.localStorage.getSessionItem(
          storeState.LocalKeys.performingLogout,
        )) === "true"
      ) {
        await storeState.localStorage.removeSessionItem(
          storeState.LocalKeys.performingLogout,
        );
        if (window.opener) {
          window.close();
        }
      }

      const hasCode = params.has("code");
      const isOnRedirectUri = window.location.href?.startsWith(redirectUri) ?? false;
      if (!hasCode || !isOnRedirectUri) {
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
      }

      if (window.opener) {
        const searchParams = new URLSearchParams(window.location.search);
        window.opener.postMessage(
          {
            type: "KINDE_AUTH_RESULT",
            result: Object.fromEntries(searchParams.entries()),
          },
          window.location.origin,
        );
        window.close();
        return;
      }
      await processAuthResult(new URLSearchParams(window.location.search));
    } finally {
      if (window.opener) {
        window.close();
      }
    }
  }, [
    clientId,
    domain,
    redirectUri,
    mergedCallbacks,
    contextValue,
    onRefresh,
    login,
    processAuthResult,
  ]);

  useEffect(() => {
    const mounted = { current: true };

    if (mounted.current) {
      init();
    }

    return () => {
      mounted.current = false;
    };
  }, [init]);

  return forceChildrenRender || initRef.current ? (
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  ) : (
    <></>
  );
};
