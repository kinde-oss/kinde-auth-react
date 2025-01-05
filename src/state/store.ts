import createKindeClient, {
  KindeClientOptions,
  KindeClient
} from '@kinde-oss/kinde-auth-pkce-js';

let authState: KindeClient | null = null;
let updatePromise: Promise<void> | null = null;

const listeners = Array<() => void>();

export const getKindeStore = () => authState;

export const createKindeStore = async (options: KindeClientOptions) => {
  if (updatePromise) return updatePromise;
  updatePromise = (async () => {
    try {
      authState = await createKindeClient(options);
      listeners.forEach((listener) => listener());
    } finally {
      updatePromise = null;
    }
  })();
  return updatePromise;
};

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};
