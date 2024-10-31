import {
  ErrorProps,
} from "@kinde-oss/kinde-auth-pkce-js";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { initialState } from "./initialState";
import { KindeContext } from "./KindeContext";
import { reducer } from "./reducer";
import { KindeUser } from "./types";
import {
  IssuerRouteTypes,
  LoginOptions,
  // MemoryStorage,
  Scopes,
  generateAuthUrl,
  exchangeAuthCode,
  LocalStorage,
  // @ts-ignore
  setActiveStorage,
  SessionManager
} from "@kinde/js-utils";
// import { handleRedirectToApp } from "../utils/handleRedirectToApp";
import { setupChallenge } from "../utils/setupChallenge";

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
  const localStore = new LocalStorage<LocalKeys>();

  const [store] = useState<LocalStorage<LocalKeys>>(
    localStore
    // !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    //   ? new LocalStorage<LocalKeys>()
    //   : new MemoryStorage<LocalKeys>()
  );
  setActiveStorage(localStore as unknown as SessionManager);


  const [state, dispatch] = useReducer(reducer, initialState);

  

  const init = async () => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has("code")) {
      const code = await exchangeAuthCode({
        urlParams: new URLSearchParams(window.location.search),
        domain,
        clientId,
        redirectURL: redirectUri,
      })
      console.log(code);
    }


    // const q = new URLSearchParams(window.location.search);
    // // Is a redirect from Kinde Auth server
    // if (isKindeRedirect(q)) {
    //   await handleRedirectToApp(q, store);
    // } else {
    //   // For onload / new tab / page refresh
    //   // if (isUseCookie || isUseLocalStorage) {
    //   //   await useRefreshToken();
    //   // }
    // }
  };



  // const isKindeRedirect = (searchParams: URLSearchParams) => {
  //   // Check if the search params hve the code parameter
  //   const hasOauthCode = searchParams.has("code");
  //   const hasError = searchParams.has("error");
  //   if (!hasOauthCode && !hasError) return false;
  //   // Also check if redirect_uri matches current url
  //   const { protocol, host, pathname } = window.location;

  //   console.log("protocol", protocol);

  //   const currentRedirectUri = redirectUri || `${protocol}//${host}${pathname}`;

  //   return (
  //     currentRedirectUri === redirectUri ||
  //     currentRedirectUri === `${redirectUri}/`
  //   );
  // };

  useEffect(() => {
    store.setItems({
      [LocalKeys.domain]: domain,
      [LocalKeys.clientId]: clientId,
      [LocalKeys.audience]: audience,
      [LocalKeys.redirectUri]: redirectUri,
      [LocalKeys.logoutUri]: logoutUri,
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

  

  // useEffect(() => {
  //   let isSubscribed = true;
  //   (() => {
  //     if (client && isSubscribed) {
  //       try {
  //         const user = client?.getUser();
  //         dispatch({ type: "INITIALISED", user });
  //       } catch (error) {
  //         console.log(error);
  //         dispatch({ type: "ERROR", error: "login error" });
  //       }
  //     }
  //   })();
  //   return () => {
  //     isSubscribed = false;
  //   };
  // }, [client]);

  // const login = useCallback(async (options?: AuthOptions | LoginOptions) => {
  //   let authProps: LoginOptions = {
  //     clientId: clientId,
  //     audience,
  //     prompt: "login",
  //     redirectURL: redirectUri,
  //   };

  //   if (isAuthOptions(options)) {
  //     const { org_code, authUrlParams, app_state, ...rest } = options;
  //     if (org_code) authProps.orgCode = options.org_code;
  //     if (authUrlParams) {
  //       authProps = {
  //         ...authProps,
  //         ...authUrlParams,
  //       };
  //     }
  //     if (app_state) {
  //       // TODO: Implement app_state
  //     }
  //     authProps = {
  //       ...authProps,
  //       ...rest,
  //     };
  //   } else {
  //     authProps = {
  //       ...authProps,
  //       ...options,
  //     };
  //   }

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

  // const getFlag = useCallback(
  //   (
  //     code: string,
  //     defaultValue?: KindeFlagValueType["s" | "b" | "i"],
  //     flagType?: "s" | "b" | "i"
  //   ) => client?.getFlag(code, defaultValue, flagType) || defaultValue,
  //   [client]
  // );

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

  // const getPermissions = useCallback(() => client?.getPermissions(), [client]);

  // const getPermission = useCallback(
  //   (key: string) => client?.getPermission(key),
  //   [client]
  // );

  // const getOrganization = useCallback(
  //   () => client?.getOrganization(),
  //   [client]
  // );

  // const getUserOrganizations = useCallback(
  //   () => client?.getUserOrganizations(),
  //   [client]
  // );

  // const createOrg = useCallback(
  //   (options?: OrgOptions) => client?.createOrg(options) || Promise.resolve(),
  //   [client]
  // );

  // const getToken = useCallback(
  //   async (options: GetTokenOptions) => {
  //     let token;
  //     try {
  //       token = await client?.getToken(options);
  //     } catch (error) {
  //       throw console.error(error);
  //     }
  //     return token;
  //   },
  //   [client]
  // );

  // const getIdToken = useCallback(
  //   async (options: GetTokenOptions) => {
  //     let idToken;
  //     try {
  //       idToken = await client?.getIdToken(options);
  //     } catch (error) {
  //       throw console.error(error);
  //     }
  //     return idToken;
  //   },
  //   [client]
  // );

  const contextValue = useMemo(() => {
    return {
      ...state,
      // getToken,
      // getIdToken,
      // login,
      // register,
      // logout,
      // createOrg,
      // getBooleanFlag,
      // getFlag,
      // getIntegerFlag,
      // getPermissions,
      // getPermission,
      // getOrganization,
      // getStringFlag,
      // getUserOrganizations,
      // getUser: getUserProfile,
      store,
    };
  }, [
    state,
    // getToken,
    // getIdToken,
    // login,
    // register,
    // logout,
    // createOrg,
    // getPermissions,
    // getPermission,
    // getOrganization,
    // getUserOrganizations,
    // getUserProfile,
    store,
  ]);

  return (
    // eslint-disable-next-line @typescript-esli nt/ban-ts-comment
    // @ts-ignore
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};
