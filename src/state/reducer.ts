import { KindeUser, State } from './types';

type Action =
  | { type: 'INITIALISED'; user: KindeUser }
  | { type: 'ERROR'; error: string };
const onInitialise = (state: State, action: Pick<State, 'user'>): State => ({
  ...state,
  isAuthenticated: Boolean(action.user),
  user: action.user,
  isLoading: false,
  error: undefined
});


const onLogout = (state: State): State => ({
  ...state,
  isAuthenticated: false,
  user: undefined
});

const onError = (state: State, action: Partial<State>): State => ({
  ...state,
  isLoading: false,
  error: action.error
});

const reducerMap = {
  INITIALISED: onInitialise,
  LOGOUT: onLogout,
  ERROR: onError
};

export const reducer = (state: State, action: Action) => {
  return reducerMap[action.type]
    ? reducerMap[action.type](state, action)
    : state;
};
