import {
  generateRandomString,
  LocalStorage,
  MemoryStorage,
  PKCEChallenge,
  PKCEChallengeState,
  SessionManager,
} from "@kinde/js-utils";
import { SESSION_PREFIX, StartsWithSessionPrefix } from "./handleRedirectToApp";
import { LocalKeys } from "../state/KindeProvider";

function sha256(plain: string): Promise<ArrayBuffer> {
  // returns promise ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer): string {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function challengeFromVerifier(v: string): Promise<string> {
  const hashed = await sha256(v);
  const base64encoded = base64urlencode(hashed);
  return base64encoded;
}

const setupChallenge = async (
  store:
    | LocalStorage<LocalKeys | StartsWithSessionPrefix>
    | MemoryStorage<LocalKeys | StartsWithSessionPrefix>,
): Promise<PKCEChallengeState> => {
  console.log("setup challenge");
  const state = generateRandomString();
  const codeVerifier = generateRandomString(); // the secret
  // Hash and base64-urlencode the secret to use as the challenge
  const codeChallenge = await challengeFromVerifier(codeVerifier);

  console.log("codeVerifier", codeVerifier);
  console.log("codeChallenge", codeChallenge);
  console.log("state", state);

  await store.setSessionItem(
    `${SESSION_PREFIX}-${state}`,
    JSON.stringify({
      codeVerifier,
      // appState,
    }),
  );

  // Build and encode the authorisation request url
  return { state, codeChallenge, codeVerifier };
};

export { setupChallenge };
