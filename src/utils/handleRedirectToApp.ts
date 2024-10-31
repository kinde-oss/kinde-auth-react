import { MemoryStorage } from "@kinde/js-utils";
import { LocalKeys } from "../state/KindeProvider";

export const SESSION_PREFIX = "pkce-code-verifier";
export type StartsWithSessionPrefix = `pkce-code-verifier-${string}`;

const clearUrlParams = () => {
  const url = new URL(window.location.toString());
  url.search = "";
  window.history.pushState({}, "", url);
};

export const handleRedirectToApp = async (
  q: URLSearchParams,
  store: MemoryStorage<LocalKeys | StartsWithSessionPrefix>,
) => {
  const code = q.get("code");
  const state = q.get("state");
  const error = q.get("error");

  const stringState = await store.getSessionItem(`${SESSION_PREFIX}-${state}`);

  // Verify state
  if (!stringState) {
    console.error("Invalid state");
  } else {
    if (error) {
      const error = q.get("error");
      const errorDescription = q.get("error_description");
      clearUrlParams();
      sessionStorage.removeItem(`${SESSION_PREFIX}-${state}`);

      // const { appState } = JSON.parse(stringState);
      // if (on_error_callback) {
      //   on_error_callback({
      //     error,
      //     errorDescription,
      //     state,
      //     appState,
      //   } as ErrorProps);
    } else {
      // window.location.href = appState.kindeOriginUrl;
    }
    return false;
  }
  const { appState, codeVerifier } = JSON.parse(stringState as string);
  // Exchange authorisation code for an access token
  // try {
  //   const response = await fetch(config.token_endpoint, {
  //     method: "POST",
  //     ...(isUseCookie && { credentials: "include" }),
  //     headers: new Headers({
  //       "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  //       "Kinde-SDK": `${config._framework || "JavaScript"}/${
  //         config._frameworkVersion || version
  //       }`,
  //     }),
  //     body: new URLSearchParams({
  //       client_id: config.client_id,
  //       code,
  //       code_verifier: codeVerifier,
  //       grant_type: "authorization_code",
  //       redirect_uri: config.redirect_uri,
  //     }),
  //   });

  //   const data = await response.json();

  //   setStore(data);
  //   // Remove auth code from address bar
  //   clearUrlParams();
  //   sessionStorage.removeItem(`${SESSION_PREFIX}-${state}`);

  //   const user = getUser();

  //   if (on_redirect_callback) {
  //     on_redirect_callback(user, appState);
  //   }
  // } catch (err) {
  //   console.error(err);
  //   sessionStorage.removeItem(`${SESSION_PREFIX}-${state}`);
  // }
  // }
};
