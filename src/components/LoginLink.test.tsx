// src/components/LoginLink.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { LoginLink } from './LoginLink';
import { useKindeAuth } from '../hooks/useKindeAuth';
import { generateAuthUrl, IssuerRouteTypes, MemoryStorage } from '@kinde/js-utils';
import { LocalKeys } from '../state/KindeProvider';

vi.mock('../hooks/useKindeAuth');

describe('LoginLink', () => {
    const mockAuth = {
        store: new MemoryStorage<LocalKeys>(),
    };

    beforeEach(() => {
        vi.mocked(useKindeAuth).mockReturnValue(mockAuth);
        vi.mocked(generateAuthUrl).mockReturnValue({ url: new URL('https://example.com/login') });
        mockStore.setSessionItem(LocalKeys.domain, 'example.com'); // Set domain in the store
    });


    it('renders correctly', async () => {
        mockAuth.store.getSessionItem.mockResolvedValue('example.com');

        render(<LoginLink sc>Login</LoginLink>);

        const linkElement = await screen.findByText('Login');
        expect(linkElement).toBeInTheDocument();
    });

    it('generates the correct auth URL', async () => {
        mockAuth.store.getSessionItem.mockResolvedValue('example.com');

        render(<LoginLink  orgCode='asasd' connectionId='asgasg'>Login</LoginLink>);

{/* <LoginLink  orgCode='asasd' connectionId='asgasg'>Login</LoginLink>

<LoginLink authParams={{
    orgCode: 'asasd',
    connectionId: 'asgasg'
}}>Login</LoginLink> */}

        const linkElement = await screen.findByText('Login');
        expect(linkElement).toHaveAttribute('href', 'https://example.com/login');
    });
});

