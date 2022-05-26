const onInitialise = (state, action) => ({
  ...state,
  isAuthenticated: !!action.user,
  user: action.user,
  isLoading: false,
  error: undefined
});

const onComplete = (state, action) =>
  state.user && state.user.updated_at === action.user && action.user.updated_at
    ? state
    : {
        ...state,
        isAuthenticated: !!action.user,
        user: action.user
      };

const onLogout = (state, action) => ({
  ...state,
  isAuthenticated: false,
  user: undefined
});

const onError = (state, action) => ({
  ...state,
  isLoading: false,
  error: action.error
});

const reducerMap = {
  INITIALISED: onInitialise,
  on_REDIRECT_COMPLETE: onComplete,
  GET_ACCESS_TOKEN_COMPLETE: onComplete,
  LOGOUT: onLogout,
  ERROR: onError
};

const reducer = (state, action) => {
  return reducerMap[action.type]
    ? reducerMap[action.type](state, action)
    : state;
};

export {reducer};
