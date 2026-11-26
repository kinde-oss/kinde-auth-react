# Kinde React

The Kinde SDK for React.

You can also use the React starter kit [here](https://github.com/kinde-starter-kits/react-starter-kit).

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com) [![Kinde Docs](https://img.shields.io/badge/Kinde-Docs-eee?style=flat-square)](https://kinde.com/docs/developer-tools/react-sdk) [![Kinde Community](https://img.shields.io/badge/Kinde-Community-eee?style=flat-square)](https://thekindecommunity.slack.com)

## Documentation

Please refer to the Kinde [React SDK document](https://kinde.com/docs/developer-tools/react-sdk).

## Step-up authentication

Step-up asks Kinde for a stronger or more recent authentication before a sensitive action, for example "MFA in the last 5 minutes before changing payout details". Kinde asks only for the missing factor; the user keeps their session.

```tsx
const { hasAuthenticationContext, stepUp } = useKindeAuth();

const changePayoutDetails = async () => {
  const requirement = { acr: "mfa", maxAge: 300 } as const;
  if (!(await hasAuthenticationContext(requirement))) {
    await stepUp(requirement); // redirects to Kinde, then back here
    return;
  }
  // ...call your API, which checks the access token itself
};
```

- `stepUp({ acr, maxAge, returnTo, state })` requires `acr` (`"mfa"` or `"phr"`, a passkey) or `maxAge` (seconds, `0` allowed). It is an interactive login: passing `prompt: "none"` throws. It rejects with "Step-up is not supported on this environment" when `acr` is set and the environment's discovery document has no `acr_values_supported`; a `maxAge`-only request falls back to `prompt=login` there.
- `login` and `register` also accept `acrValues` and `maxAge`. Unset values are left off the URL.
- `getAuthenticationContext()` returns `{ acr, amr, authTime }` (`acr` is `null` after a single-factor sign-in). `hasAuthenticationContext({ acr, maxAge })` treats `phr` as meeting `mfa`, and a missing `auth_time` as failing `maxAge`. Both read the tokens in the browser, so use them for UI decisions only; your API must check the verified access token.
- `isStepUpSupported()` reads `acr_values_supported` from the environment's discovery document. Where it is `false`, `auth_time` may be the token's issue time, so `getAuthenticationContext()` returns `authTime: null` and a `maxAge` check doesn't pass.

### Components

```tsx
import { StepUpLink } from "@kinde-oss/kinde-auth-react/components";
import { ProtectedRoute } from "@kinde-oss/kinde-auth-react/react-router";

<StepUpLink acr="mfa" maxAge={300}>Verify to continue</StepUpLink>

<ProtectedRoute acr="mfa" maxAge={300} fallbackPath="/settings">
  <PayoutDetails />
</ProtectedRoute>
```

`ProtectedRoute` with `acr` or `maxAge` starts a step-up when a signed-in user doesn't meet the requirement. If the user comes back from a step-up started by that route and still doesn't meet it (for example, Kinde answered `unmet_authentication_requirements`), the route goes to `fallbackPath` instead of starting another step-up, so it never loops. If `stepUp` itself fails (for example, step-up isn't supported on the environment, or the popup is blocked), the route goes to `fallbackPath` and tries again only on a later visit. It remembers that attempt in `sessionStorage` for 10 minutes; if `sessionStorage` isn't available, the route goes to `fallbackPath` rather than stepping up without that guard. While another route's step-up is outstanding, the route shows its loading state, and checks again once that attempt expires.

### API challenges

An API that needs a stronger context answers `401` with `WWW-Authenticate: Bearer error="insufficient_user_authentication", acr_values="mfa"`. Pass the response to `handleStepUpChallenge`, which starts `stepUp` with what the API asked for and resolves `false` for any other response:

```tsx
const { getAccessToken, handleStepUpChallenge } = useKindeAuth();

const response = await fetch("/api/payouts", {
  method: "POST",
  headers: { Authorization: `Bearer ${await getAccessToken()}` },
});
if (await handleStepUpChallenge(response)) return; // redirecting to Kinde
```

After the step-up, retry the request at most once. `parseStepUpChallenge`, `stepUpRequiredFromResponse` and `StepUpRequiredError` are also exported from `@kinde-oss/kinde-auth-react` if you want to handle the challenge yourself. Allow the browser to read the header: the API's CORS response must include `Access-Control-Expose-Headers: WWW-Authenticate`.

### Returning the user

`stepUp` returns the user to `returnTo` (default: the current path, same-origin only). With the default `onSuccess`, the SDK does this itself. With your own `onSuccess`, read it from `state.returnTo` and navigate with your router. `onEvent` is called with the event `"stepUp"`.

### When Kinde can't meet the request

If the user can't complete the step-up (for example `acr: "phr"` without a passkey, or `acr: "mfa"` without an enrolled factor), Kinde returns `error=unmet_authentication_requirements`. The SDK checks `state` and calls `onError` with `error: "unmet_authentication_requirements"` and `cause`, an `UnmetAuthenticationRequirementsError`. This is a final answer: don't retry and don't send the user to login, which would loop. Tell the user why, for example "Add a passkey to continue". `login_required` (after `prompt=none`) is reported the same way, with a `LoginRequiredError`.

```tsx
import {
  KindeProvider,
  UnmetAuthenticationRequirementsError,
} from "@kinde-oss/kinde-auth-react";

<KindeProvider
  callbacks={{
    onError: ({ error, cause }, state) => {
      if (cause instanceof UnmetAuthenticationRequirementsError) {
        showMessage("We couldn't verify you with a second factor.");
        navigate(state.returnTo ?? "/");
      }
    },
  }}
  // ...
/>;
```

Import the error classes from `@kinde-oss/kinde-auth-react`, not from `@kinde/js-utils`: this package bundles its own copy, so a class from a separate install fails `instanceof`. Checking `error === "unmet_authentication_requirements"` works either way.

The step-up runs as a full-page redirect, so these errors arrive through `onError` rather than as a rejected `stepUp` promise. Unlike other errors (`ERR_*`), their `error` is the OAuth error code.

### What `mfa` and `phr` assert

`acr: "mfa"` means two factors were accepted under your MFA policy; it doesn't assert they're independent (for example, a social sign-in followed by a one-time code to the same mailbox). `phr` is stronger, because a phishing site can't use a passkey. For payments and regulated workloads, assess factor independence, enrolment and recovery against your own configuration rather than relying on `acr` alone.

## Publishing

The core team handles publishing.

To publish a new package version, use the “Release and Publish to NPM” action in the “Actions” tab.

## Contributing

Please refer to Kinde’s [contributing guidelines](https://github.com/kinde-oss/.github/blob/489e2ca9c3307c2b2e098a885e22f2239116394a/CONTRIBUTING.md).

## Playground

To create the playground run `npm run dev:prepare`

This will clone the React starter kit into a `/playground` directory and reference the SDK via `npm link`.

You will need to add your Kinde credentials to the generated `.env` file inside `/playground`

`npm run dev` will load up the playground on [http://localhost:3000](http://localhost:3000)

## License

By contributing to Kinde, you agree that your contributions will be licensed under its MIT License.
