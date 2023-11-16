import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export default withMiddlewareAuthRequired();

export const config = {
  // match any endpoint in /api/chat
  matcher: ["/api/chat/:path*", "/chat/:path*"],
};
