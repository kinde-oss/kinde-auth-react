import type { SessionManager } from "@kinde/js-utils";

enum LocalKeys {
  domain = "domain",
  clientId = "client_id",
  audience = "audience",
  redirectUri = "redirect_uri",
  logoutUri = "logout_uri",
}

let memoryStorage: SessionManager<LocalKeys> | undefined;
let localStorage: SessionManager<LocalKeys> | undefined;

const storeReady = (async () => {
  const { MemoryStorage, LocalStorage, setActiveStorage, setInsecureStorage } =
    await import("@kinde/js-utils");

  memoryStorage = new MemoryStorage<LocalKeys>();
  localStorage = new LocalStorage<LocalKeys>();
  // TODO: Resolve type issue
  //@ts-expect-error valid assignment
  setActiveStorage(memoryStorage);
  //@ts-expect-error valid assignment
  setInsecureStorage(localStorage);
  return;
})()

export { memoryStorage, localStorage, LocalKeys, storeReady };
