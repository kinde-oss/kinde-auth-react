  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
import { MemoryStorage, setActiveStorage } from "@kinde/js-utils";

const memoryStorage = new MemoryStorage();
setActiveStorage(memoryStorage);

export default {
    memoryStorage: memoryStorage
}