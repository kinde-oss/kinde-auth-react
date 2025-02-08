export const getRedirectUrl = (suppliedUrl?: string) => {
  return suppliedUrl || window.location.origin;
};
