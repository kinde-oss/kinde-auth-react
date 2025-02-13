import type { SessionManager } from "@kinde/js-utils";

enum LocalKeys {
  domain = "domain",
  clientId = "client_id",
  audience = "audience",
  redirectUri = "redirect_uri",
  logoutUri = "logout_uri",
}

let memoryStorage: SessionManager<LocalKeys>;
let localStorage: SessionManager<LocalKeys>;

(async () => {
  const { MemoryStorage, LocalStorage, setActiveStorage, setInsecureStorage } =
    await import("@kinde/js-utils");

  memoryStorage = new MemoryStorage<LocalKeys>();
  localStorage = new LocalStorage<LocalKeys>();

  setActiveStorage(memoryStorage);
  setInsecureStorage(localStorage);
})();

export { memoryStorage, localStorage, LocalKeys };
