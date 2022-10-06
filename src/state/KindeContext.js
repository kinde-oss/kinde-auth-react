import {createContext} from 'react';
import {initialState} from '../config/initialState';

const handleError = () => {
  throw new Error(
    'Oops! Seems like you forgot to wrap your app in <KindeProvider>.'
  );
};

const initialContext = {
  ...initialState,
  getToken: handleError,
  login: handleError,
  logout: handleError,
  register: handleError,
  createOrg: handleError
};

const KindeContext = createContext(initialContext);

export {KindeContext};
