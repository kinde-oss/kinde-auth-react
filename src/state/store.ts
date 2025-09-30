import {
  MemoryStorage,
  LocalStorage,
  setActiveStorage,
  setInsecureStorage,
} from "@kinde/js-utils";

enum LocalKeys {
  performingLogout = "performing_logout",
}

const memoryStorage = new MemoryStorage();
const localStorage = new LocalStorage<LocalKeys>();

setActiveStorage(memoryStorage);
//@ts-expect-error valid assignment
setInsecureStorage(localStorage);

export { memoryStorage, localStorage, LocalKeys };
