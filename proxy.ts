import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets, auth endpoints, and webhooks bypass middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.includes("/opengraph-image") ||
    pathname.includes(".") // favicon, images, fonts
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session token cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isPublicAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";
  const isLandingPage = pathname === "/";
  const isPublicDemoPage =
    pathname === "/features" ||
    pathname === "/platform" ||
    pathname === "/documentation";

  // GUEST (Not logged in)
  if (!sessionToken) {
    // Guest accessing protected route → redirect to sign-in
    if (!isPublicAuthRoute && !isLandingPage && !isPublicDemoPage) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // LOGGED IN USER
  // If authenticated user tries to access /sign-in or /sign-up, redirect to /dashboard
  if (isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // RBAC for /admin route
  if (pathname.startsWith("/admin")) {
    try {
      // Query the internal session endpoint to verify user role
      const sessionRes = await fetch(new URL("/api/auth/get-session", request.url), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (!sessionRes.ok) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      const sessionData = await sessionRes.json();
      if (!sessionData?.user || sessionData.user.role !== "ADMIN") {
        return NextResponse.redirect(
          new URL("/dashboard?error=unauthorized_admin", request.url)
        );
      }
    } catch (err) {
      console.error("RBAC middleware admin verification error:", err);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
