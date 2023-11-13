import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";

// handleAuth() does not expose a signup route by default therefore we add custom signup route
export default handleAuth({
  signup: handleLogin({
    authorizationParams: {
      screen_hint: "signup",
    },
  }),
});
