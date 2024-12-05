export const getRedirectUrl = (suppliedUrl?: string) => {
    console.log('suppliedUrl', suppliedUrl);
    console.log('VITE_KINDE_REDIRECT_URL', import.meta.env.VITE_KINDE_REDIRECT_URL);
    console.log('window.location.origin', window.location.origin);

    return suppliedUrl ||
        window.location.origin
}