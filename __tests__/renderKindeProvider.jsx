import React from 'react';
import {KindeProvider} from '../src/index';

export const renderKindeProvider =
  ({
    domain = '__test_domain__',
    redirectUri = '__test_redirect_uri__',
    ...props
  } = {}) =>
  ({children}) =>
    (
      <KindeProvider domain={domain} redirectUri={redirectUri} {...props}>
        {children}
      </KindeProvider>
    );
