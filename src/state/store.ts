import {
  MemoryStorage,
  setActiveStorage,
  setInsecureStorage,
  LocalStorage,
} from "@kinde/js-utils";

enum LocalKeys {
  domain = "domain",
  clientId = "client_id",
  audience = "audience",
  redirectUri = "redirect_uri",
  logoutUri = "logout_uri",
}

const memoryStorage = new MemoryStorage<LocalKeys>();
const localStorage = new LocalStorage<LocalKeys>();

setActiveStorage(memoryStorage);
setInsecureStorage(localStorage);

export { memoryStorage, localStorage, LocalKeys };
