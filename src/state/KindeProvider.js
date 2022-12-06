import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import {KindeContext} from './KindeContext';
import {initialState} from '../config/initialState';
import {reducer} from './reducer';
import createKindeClient from '@kinde-oss/kinde-auth-pkce-js';

const defaultOnRedirectCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

const KindeProvider = ({
  audience,
  scope,
  clientId,
  children,
  domain,
  isDangerouslyUseLocalStorage = false,
  redirectUri,
  onRedirectCallback = defaultOnRedirectCallback,
  logoutUri
}) => {
  const [client, setClient] = useState();
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
          on_redirect_callback: onRedirectCallback
        });
        setClient(kindeClient);
      };

      getClient();
    } catch (err) {
      console.error(err);
    }
    return () => (isSubscribed = false);
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
          const user = client.getUser();
          dispatch({type: 'INITIALISED', user});
        } catch (error) {
          console.log(error);
          dispatch({type: 'ERROR', error: 'login error'});
        }
      }
    })();
    return () => (isSubscribed = false);
  }, [client]);

  const login = useCallback((options) => client.login(options), [client]);

  const register = useCallback((options) => client.register(options), [client]);

  const logout = useCallback(() => client.logout(), [client]);

  const getClaim = useCallback(
    (claim, tokenType) => client.getClaim(claim, tokenType),
    [client]
  );

  const getPermissions = useCallback(() => client.getPermissions(), [client]);

  const getPermission = useCallback(
    (key) => client.getPermission(key),
    [client]
  );

  const getOrganization = useCallback(() => client.getOrganization(), [client]);

  const getUserOrganizations = useCallback(
    () => client.getUserOrganizations(),
    [client]
  );

  const createOrg = useCallback(
    (options) => client.createOrg(options),
    [client]
  );

  const getToken = useCallback(async () => {
    let token;
    try {
      token = await client.getToken();
    } catch (error) {
      throw console.error(error);
    }
    return token;
  }, [client]);

  const contextValue = useMemo(() => {
    return {
      ...state,
      getToken,
      login,
      register,
      logout,
      createOrg,
      getClaim,
      getPermissions,
      getPermission,
      getOrganization,
      getUserOrganizations
    };
  }, [
    state,
    getToken,
    login,
    register,
    logout,
    createOrg,
    getClaim,
    getPermissions,
    getPermission,
    getOrganization,
    getUserOrganizations
  ]);

  return (
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};

export {KindeProvider};
