import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LoginLink } from './LoginLink';
// import { useKindeAuth } from '../hooks/useKindeAuth';
// import { generateAuthUrl, MemoryStorage } from '@kinde/js-utils';
// import { LocalKeys } from '../state/KindeProvider';

// vi.mock('../hooks/useKindeAuth', async () => {
//   const actualModule = await vi.importActual('../hooks/useKindeAuth'); 
//   return {
//     ...actualModule, // Use the actual module
//     generateAuthUrl: vi.fn(), // Mock only this function
//   };
// });
// vi.mock('@kinde/js-utils', () => ({
//   generateAuthUrl: vi.fn(),
//   MemoryStorage: vi.fn().mockImplementation(() => ({
//     getSessionItem: vi.fn(),
//     setSessionItem: vi.fn(),
//   })),
// }));

afterEach(() => {
  cleanup();
})

describe('LoginLink', () => {


  it('renders correctly', async () => {
    // mockAuth.store.getSessionItem.mockResolvedValue('example.com');

    render(<LoginLink>Login</LoginLink>);

    const linkElement = await screen.findByText('Login');
    expect(linkElement).toBeInTheDocument();
  });

  // it('generates the correct auth URL', async () => {
  //   mockAuth.store.getSessionItem.mockResolvedValue('example.com');

  //   render(<LoginLink audience="test-audience" clientId="test-client-id">Login</LoginLink>);

  //   const linkElement = await screen.findByText('Login');
  //   expect(linkElement).toHaveAttribute('href', 'https://example.com/login');
  // });
});
