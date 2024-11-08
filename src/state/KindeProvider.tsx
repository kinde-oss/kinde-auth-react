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
} from "@kinde/js-utils";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KindeContext } from "./KindeContext";
import { KindeUser } from "./types";

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
  scope?: string;
};



import * as storeState from './store';

// const memoryStore = new MemoryStorage<LocalKeys>();

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

  frameworkSettings.framework = "react";
  frameworkSettings.frameworkVersion = "1.0.0";
  // frameworkSettings.frameworkVersion = "1.0.0";

  const [state, setState] = useState({ isAuthenticated: false});

  // const [store] = useState<MemoryStorage<LocalKeys>>(
  //   storeState.default.memoryStorage as unknown as MemoryStorage<LocalKeys>,
  //   // !process.env.NODE_ENV || process.env.NODE_ENV === "development"
  //   //   ? new LocalStorage<LocalKeys>()
  //   //   : new MemoryStorage<LocalKeys>()
  // );
  // // const [insecureStore] = useState<LocalStorage<LocalKeys>>(
  // //   localStorage,
  // //   // !process.env.NODE_ENV || process.env.NODE_ENV === "development"
  // //   //   ? new LocalStorage<LocalKeys>()
  // //   //   : new MemoryStorage<LocalKeys>()
  // // );

  
  // const [state, dispatch] = useReducer(reducer, initialState);

  const init = async () => {
    const params = new URLSearchParams(window.location.search);

    const redirectURL = await storeState.memoryStorage.getSessionItem(storeState.LocalKeys.redirectUri) as string;

    if (params.has("code")) {
      const code = await exchangeAuthCode({
        urlParams: new URLSearchParams(window.location.search),
        domain,
        clientId,
        redirectURL: redirectURL ||
          import.meta.env.VITE_KINDE_REDIRECT_URL ||
          window.location.origin,
      });
      if (code.success) {
        console.log("code - setting is authenticated", code);
        const user = await getUserProfile()
        console.log('this is the user', user);
        setState((val) => { return {...val, user: user,  isAuthenticated: true}});
      }
    }
  };

  useEffect(() => {
    storeState.memoryStorage.setItems({
      [storeState.LocalKeys.domain]: domain,
      [storeState.LocalKeys.clientId]: clientId,
      [storeState.LocalKeys.audience]: audience,
      [storeState.LocalKeys.redirectUri]: redirectUri,
      [storeState.LocalKeys.logoutUri]: logoutUri,
    });

    init();
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

  const login = useCallback(async (options?: AuthOptions | LoginMethodParams) => {

    if (isAuthOptions(options)) {
      console.log("isAuthOptions", options);
    } else {
      if (!options) {
        return
      }

      const authProps: LoginOptions = {
        audience: (await storeState.memoryStorage.getSessionItem(storeState.LocalKeys.audience)) as string,
        clientId: (await storeState.memoryStorage.getSessionItem(storeState.LocalKeys.clientId)) as string,
        ...options,
        redirectURL:
          options.redirectURL ||
          import.meta.env.VITE_KINDE_REDIRECT_URL ||
          window.location.origin,
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
      console.log(authUrl);
      console.log(authUrl.url.toString());
      document.location = authUrl.url.toString();
    }
  }, [])
  
  const register = useCallback(async (options?: AuthOptions | LoginMethodParams)  => {
    if (isAuthOptions(options)) {
      console.log("isAuthOptions", options);
    } else {
      const authProps: LoginOptions = {
        audience: (await storeState.memoryStorage.getSessionItem(storeState.LocalKeys.audience)) as string,
        clientId: (await storeState.memoryStorage.getSessionItem(storeState.LocalKeys.clientId)) as string,
        redirectURL:
          options?.redirectURL ||
          import.meta.env.VITE_KINDE_REDIRECT_URL ||
          window.location.origin,
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
  }, []);

  const logout = useCallback(async (redirectUrl: string) => {
    const domain = (await storeState.memoryStorage.getSessionItem(
      storeState.LocalKeys.domain,
    )) as string;

    const params = new URLSearchParams();
    if (redirectUrl) {
      params.append("redirect", redirectUrl);
    }
    document.location = `${domain}/logout?${params.toString()}`;
    const user = await getUserProfile()
    console.log('this is the user', user);
    setState((val) => { return {...val, user: user, isAuthenticated: false}});

  },[])

  // const login = useCallback(async (options?: AuthOptions | LoginMethodParams) => {
  //   let authProps: LoginOptions = {
  //     clientId: clientId,
  //     audience,
  //     prompt: "login",
  //     redirectURL: redirectUri,
  //   };

    // if (isAuthOptions(options)) {
    //   const { org_code, authUrlParams, app_state, ...rest } = options;
    //   if (org_code) authProps.orgCode = options.org_code;
    //   if (authUrlParams) {
    //     authProps = {
    //       ...authProps,
    //       ...authUrlParams,
    //     };
    //   }
    //   if (app_state) {
    //     // TODO: Implement app_state
    //   }
    //   authProps = {
    //     ...authProps,
    //     ...rest,
    //   };
    // } else {
    //   authProps = {
    //     ...authProps,
    //     ...options,
    //   };
    // }

  //   const { codeChallenge, state } = await setupChallenge(store);
  //   console.log("codeChallenge", codeChallenge);

  //   authProps.audience = "";
  //   authProps.codeChallenge = codeChallenge;
  //   authProps.codeChallengeMethod = "S256";
  //   authProps.state = state;

  //   console.log("store", store);

  //   // window.location.href = generateAuthUrl(
  //   //   domain,
  //   //   IssuerRouteTypes.login,
  //   //   authProps
  //   // ).url.toString();
  // }, []);

  // const register = useCallback(async (options?: AuthOptions | LoginOptions) => {
  //   let cleanedOptions: LoginOptions = {
  //     clientId: clientId,
  //     audience,
  //     prompt: "register",
  //     redirectURL: redirectUri,
  //   };
  //   if (isAuthOptions(options)) {
  //     if ("org_code" in options) cleanedOptions.orgCode = options.org_code;
  //     if ("authUrlParams" in options && options.authUrlParams) {
  //       cleanedOptions = {
  //         ...cleanedOptions,
  //         ...options,
  //       };
  //     }
  //   }
  //   // window.location.href = (await generateAuthUrl(
  //   //   domain,
  //   //   IssuerRouteTypes.register,
  //   //   cleanedOptions
  //   // )).url.toString();
  // }, []);

  // const logout = useCallback((redirectUrl?: string) => {
  //   const params = new URLSearchParams();
  //   if (redirectUrl) {
  //     params.append("redirect", redirectUrl);
  //   }

  //   return new URL(`${domain}/logout?${params.toString()}`);
  // }, []);


  // const getBooleanFlag = useCallback(
  //   (code: string, defaultValue?: boolean) =>
  //     client?.getBooleanFlag(code, defaultValue) || defaultValue || false,
  //   [client]
  // );

  // const getIntegerFlag = useCallback(
  //   (code: string, defaultValue: number) =>
  //     client?.getIntegerFlag(code, defaultValue) || defaultValue,
  //   [client]
  // );

  // const getStringFlag = useCallback(
  //   (code: string, defaultValue: string) =>
  //     client?.getStringFlag(code, defaultValue) || defaultValue,
  //   [client]
  // );

  // const createOrg = useCallback(
  //   (options?: OrgOptions) => client?.createOrg(options) || Promise.resolve(),
  //   [client]
  // );
  
  const contextValue = useMemo(() => {
    return {
      // Internal Methods
      login,
      logout,
      register,

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
        const { getClaim } = await import('@kinde/js-utils');
        return getClaim(...args);
      },
      getClaims: async (...args: Parameters<typeof getClaims>) => {
        const { getClaims } = await import('@kinde/js-utils');
        return getClaims(...args);
      },
      /** @deprecated use `getCurrentOrganization` instead */
      getOrganization: async (...args: Parameters<typeof getCurrentOrganization>) => {
        const { getCurrentOrganization } = await import('@kinde/js-utils');
        return getCurrentOrganization(...args);
      },
      getCurrentOrganization: async (...args: Parameters<typeof getCurrentOrganization>) => {
        const { getCurrentOrganization } = await import('@kinde/js-utils');
        return getCurrentOrganization(...args);
      },

      getFlag: async (...args: Parameters<typeof getFlag>) => {
        const { getFlag } = await import('@kinde/js-utils');
        return getFlag(...args);
      },
      getUserProfile: async (...args: Parameters<typeof getUserProfile>) => {
        const { getUserProfile } = await import('@kinde/js-utils');
        return getUserProfile(...args);
      },
      getPermission: async (...args: Parameters<typeof getPermission>) => {
        const { getPermission } = await import('@kinde/js-utils');
        return getPermission(...args);
      },      
      getPermissions: async (...args: Parameters<typeof getPermissions>) => {
        const { getPermissions } = await import('@kinde/js-utils');
        return getPermissions(...args);
      },
      getUserOrganizations: async (...args: Parameters<typeof getUserOrganizations>) => {
        const { getUserOrganizations } = await import('@kinde/js-utils');
        return getUserOrganizations(...args);
      },
      getRoles: async (...args: Parameters<typeof getRoles>) => {
        const { getRoles } = await import('@kinde/js-utils');
        return getRoles(...args);
      },
      refreshToken: async (...args: Parameters<typeof refreshToken>) => {
        const { refreshToken } = await import('@kinde/js-utils');
        return refreshToken(...args);
      },
      ...state,

    };
  }, [
    state,
  ]);

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};
