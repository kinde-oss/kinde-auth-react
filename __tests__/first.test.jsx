import React, {useContext} from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {renderKindeProvider} from './renderKindeProvider.jsx';
import {KindeContext} from '../src/state/KindeContext';
import * as createKindeClient from '@kinde-oss/kinde-auth-pkce-js';

const createKindeClientSpy = jest.spyOn(createKindeClient, 'default');

describe('KindeProvider', () => {
  afterEach(() => {
    window.history.pushState({}, document.title, '/');
  });

  it('should provide KindeProvider functions', async () => {
    const wrapper = renderKindeProvider();

    const {result, waitForNextUpdate} = renderHook(
      () => useContext(KindeContext),
      {wrapper}
    );
    expect(result.current).toBeDefined();
    await waitForNextUpdate();
  });

  it('should configure an instance of KindeClient', async () => {
    const opts = {
      domain: 'foo',
      redirectUri: 'bar'
    };

    const wrapper = renderKindeProvider(opts);
    const {waitForNextUpdate} = renderHook(() => useContext(KindeContext), {
      wrapper
    });

    expect(createKindeClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'foo',
        redirect_uri: 'bar'
      })
    );

    await waitForNextUpdate();
  });
});
