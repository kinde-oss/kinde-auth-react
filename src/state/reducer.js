const onInitialise = (state, action) => ({
  ...state,
  isAuthenticated: !!action.user,
  user: action.user,
  isLoading: false,
  error: undefined
});


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
  LOGOUT: onLogout,
  ERROR: onError
};

const reducer = (state, action) => {
  return reducerMap[action.type]
    ? reducerMap[action.type](state, action)
    : state;
};

export {reducer};
