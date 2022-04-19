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
  children,
  domain,
  redirectUri,
  onRedirectCallback = defaultOnRedirectCallback,
  logoutUri = redirectUri
}) => {
  const [client, setClient] = useState();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isSubscribed = true;
    try {
      const getClient = async () => {
        const kindeClient = await createKindeClient({
          domain,
          redirect_uri: redirectUri,
          logout_uri: logoutUri
        });
        setClient(kindeClient);
      };

      getClient();
    } catch (err) {
      console.error(err);
    }
    return () => (isSubscribed = false);
  }, [domain, redirectUri, logoutUri]);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      if (client && isSubscribed) {
        try {
          const {kindeState} = await client.handleRedirectCallback();
          onRedirectCallback(kindeState);

          const user = await client.getUser();
          dispatch({type: 'INITIALISED', user});
        } catch (error) {
          console.log(error);
          dispatch({type: 'ERROR', error: 'login error'});
        }
      }
    })();
    return () => (isSubscribed = false);
  }, [client, onRedirectCallback]);

  const login = useCallback(() => client.login(), [client]);

  const register = useCallback(() => client.register(), [client]);

  const logout = useCallback(() => client.logout(), [client]);

  const getToken = useCallback(async () => {
    let token;
    try {
      token = await client.getToken();
    } catch (error) {
      throw console.error(error);
    } finally {
      dispatch({
        type: 'GET_ACCESS_TOKEN_COMPLETE',
        user: await client.getUser()
      });
    }
    return token;
  }, [client]);

  const handleRedirectCallback = useCallback(async () => {
    try {
      return await client.handleRedirectCallback();
    } catch (error) {
      console.error(error);
    } finally {
      dispatch({
        type: 'HANDLE_REDIRECT_COMPLETE',
        user: await client.getUser()
      });
    }
  }, [client]);

  const contextValue = useMemo(() => {
    return {
      ...state,
      getToken,
      login,
      register,
      logout,
      handleRedirectCallback
    };
  }, [state, getToken, login, register, logout, handleRedirectCallback]);

  return (
    <KindeContext.Provider value={contextValue}>
      {children}
    </KindeContext.Provider>
  );
};

export {KindeProvider};
