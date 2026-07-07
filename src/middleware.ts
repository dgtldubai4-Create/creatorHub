import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/constants";

// Route → allowed roles. Anything not listed here (and matched below) just
// requires a signed-in session.
const ROLE_RULES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/queue", roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { prefix: "/creators", roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { prefix: "/submit", roles: ["CREATOR"] },
  { prefix: "/me", roles: ["CREATOR"] },
];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as Role | undefined;
    const { pathname } = req.nextUrl;

    const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
    if (rule && (!role || !rule.roles.includes(role))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

// Everything except auth pages, NextAuth API, and static assets requires auth.
export const config = {
  matcher: [
    "/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
