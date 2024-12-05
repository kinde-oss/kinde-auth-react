import { ErrorProps } from "@kinde-oss/kinde-auth-pkce-js";
import {
  exchangeAuthCode,
  generateAuthUrl,
  IssuerRouteTypes,
  LoginMethodParams,
  LoginOptions,
  Scopes,
  frameworkSettings,
  getDecodedToken,
  getClaim,
  getClaims,
  getCurrentOrganization,
  getFlag,
  getUserProfile,
  getPermission,
  getPermissions,
  getUserOrganizations,
  getRoles,
  refreshToken,
  storageSettings,
  checkAuth,
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
import { KindeUser } from "./types";
import { getRedirectUrl } from "../utils/getRedirectUrl";

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
    state?: Record<string, unknown>,
  ) => void;
  onErrorCallback?: (props: ErrorProps) => void;
  callbacks?: {
    onRedirect?: (user: KindeUser, state?: Record<string, unknown>) => void;
    onCallback?: (props: ErrorProps) => void;
  };
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
  // callbacks: {
  //   // onRedirect = defaultOnRedirectCallback,
  //   // onError,
  // },
  logoutUri,
}: KindeProviderProps) => {
  /// TODO: Switch out dev mode for local storage

  frameworkSettings.framework = "react";
  frameworkSettings.frameworkVersion = "1.0.0";
  // frameworkSettings.sdkVersion = "1.0.0";
  // frameworkSettings.language = "JavaScript";

  const [state, setState] = useState({ isAuthenticated: false });
  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    console.log(await checkAuth({ domain, clientId }));
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);

    if (!params.has("code")) {
      return;
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
      setState((val) => ({ ...val, user, isAuthenticated: true }));
    }
  }, [clientId, domain]);

  useEffect(() => {
    init();
  }, [init, domain, clientId]);

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
    async (options?: AuthOptions | LoginMethodParams) => {
      if (isAuthOptions(options)) {
        console.log("isAuthOptions", options);
      } else {
        if (!options) {
          return;
        }

        const authProps: LoginOptions = {
          audience: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.audience,
          )) as string,
          clientId: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.clientId,
          )) as string,
          ...options,
          redirectURL: getRedirectUrl(options.redirectURL || redirectUri),
          prompt: "login",
        };
        const domain = (await storeState.memoryStorage.getSessionItem(
          storeState.LocalKeys.domain,
        )) as string;

        authProps.audience = "";
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
    async (options?: AuthOptions | LoginMethodParams) => {
      if (isAuthOptions(options)) {
        console.log("isAuthOptions", options);
      } else {
        const authProps: LoginOptions = {
          audience: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.audience,
          )) as string,
          clientId: (await storeState.memoryStorage.getSessionItem(
            storeState.LocalKeys.clientId,
          )) as string,
          redirectURL: getRedirectUrl(options?.redirectURL || redirectUri),
          prompt: "register",
          ...options,
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
    document.location = `${domain}/logout?${params.toString()}`;
    const user = await getUserProfile();
    setState((val) => {
      return { ...val, user: user, isAuthenticated: false };
    });
  }, []);

  const contextValue: KindeContextProps = useMemo(() => {
    return {
      // Internal Methods
      login,
      logout,
      register,

      store: storeState.memoryStorage,
      isLoading: false,

      getIdToken: async () => {
        return getDecodedToken("idToken");
      },
      getAccessToken: async () => {
        return getDecodedToken();
      },
      /** @deprecated use `getAccessToken` instead */
      getToken: async () => {
        return getDecodedToken();
      },

      getClaim: async (...args: Parameters<typeof getClaim>) => {
        const { getClaim } = await import("@kinde/js-utils");
        return getClaim(...args);
      },
      getClaims: async (...args: Parameters<typeof getClaims>) => {
        const { getClaims } = await import("@kinde/js-utils");
        return getClaims(...args);
      },
      /** @deprecated use `getCurrentOrganization` instead */
      getOrganization: async (
        ...args: Parameters<typeof getCurrentOrganization>
      ) => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return getCurrentOrganization(...args);
      },
      getCurrentOrganization: async (
        ...args: Parameters<typeof getCurrentOrganization>
      ) => {
        const { getCurrentOrganization } = await import("@kinde/js-utils");
        return getCurrentOrganization(...args);
      },
      getFlag: async (...args: Parameters<typeof getFlag>) => {
        const { getFlag } = await import("@kinde/js-utils");
        return getFlag(...args);
      },
      getUserProfile: async (...args: Parameters<typeof getUserProfile>) => {
        const { getUserProfile } = await import("@kinde/js-utils");
        return getUserProfile(...args);
      },
      getPermission: async (...args: Parameters<typeof getPermission>) => {
        const { getPermission } = await import("@kinde/js-utils");
        return getPermission(...args);
      },
      getPermissions: async (...args: Parameters<typeof getPermissions>) => {
        const { getPermissions } = await import("@kinde/js-utils");
        return getPermissions(...args);
      },
      getUserOrganizations: async (
        ...args: Parameters<typeof getUserOrganizations>
      ) => {
        const { getUserOrganizations } = await import("@kinde/js-utils");
        return getUserOrganizations(...args);
      },
      getRoles: async (...args: Parameters<typeof getRoles>) => {
        const { getRoles } = await import("@kinde/js-utils");
        return getRoles(...args);
      },
      refreshToken: async (...args: Parameters<typeof refreshToken>) => {
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
