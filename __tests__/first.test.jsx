import React, {useContext} from 'react';
import {renderHook, act} from '@testing-library/react-hooks';
import {renderKindeProvider} from './renderKindeProvider.jsx';
import {KindeContext} from '../src/state/KindeContext';
import {LocalStorageMock} from '../src/mocks/mock-local-storage.js';
import * as createKindeClient from '@kinde-oss/kinde-auth-pkce-js';

// eslint-disable-next-line no-undef
global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();

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

  it('should check session when logged out', async () => {
    const wrapper = renderKindeProvider();
    const {waitForNextUpdate, result} = renderHook(
      () => useContext(KindeContext),
      {wrapper}
    );
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should check session when logged in', async () => {
    const wrapper = renderKindeProvider();

    localStorage.setItem(
      'kinde_token',
      JSON.stringify({
        access_token: 'access_token'
      })
    );

    const {waitForNextUpdate, result} = renderHook(
      () => useContext(KindeContext),
      {wrapper}
    );

    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle redirect callback success and clear the url', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );

    expect(window.location.href).toBe(
      'https://www.example.com/?code=__test_code__&state=__test_state__'
    );

    sessionStorage.setItem(
      'pkce-code-verifier-__test_state__',
      '__test_code_verifier__'
    );

    const wrapper = renderKindeProvider();
    const {waitForNextUpdate} = renderHook(() => useContext(KindeContext), {
      wrapper
    });

    await waitForNextUpdate();
    await waitForNextUpdate();
    expect(window.location.href).toBe('https://www.example.com/');
  });

  it('should handle redirect callback success and return to app state param', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );

    expect(window.location.href).toBe(
      'https://www.example.com/?code=__test_code__&state=__test_state__'
    );

    sessionStorage.setItem(
      'pkce-code-verifier-__test_state__',
      '__test_code_verifier__'
    );

    const wrapper = renderKindeProvider();
    const {waitForNextUpdate} = renderHook(() => useContext(KindeContext), {
      wrapper
    });

    await waitForNextUpdate();
    await waitForNextUpdate();
    expect(window.location.href).toBe('https://www.example.com/');
  });
});
