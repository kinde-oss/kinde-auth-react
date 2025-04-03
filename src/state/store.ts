import {
  MemoryStorage,
  LocalStorage,
  setActiveStorage,
  setInsecureStorage,
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
// TODO: Resolve type issue
//@ts-expect-error valid assignment
setActiveStorage(memoryStorage);
//@ts-expect-error valid assignment
setInsecureStorage(localStorage);

export { memoryStorage, localStorage, LocalKeys };
