import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  const role = token?.role;

  if (
    token &&
    (url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname === "/")
  ) {
    if (role === "DRIVER") {
      return NextResponse.redirect(
        new URL("/driver/dashboard", request.url)
      );
    }

    if (role === "RIDER") {
      return NextResponse.redirect(
        new URL("/rider/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  if (!token) {
    if (
      url.pathname.startsWith("/driver") ||
      url.pathname.startsWith("/rider")
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  if (token) {
    if (role === "RIDER" && url.pathname.startsWith("/driver")) {
      return NextResponse.redirect(
        new URL("/rider/dashboard", request.url)
      );
    }

    if (role === "DRIVER" && url.pathname.startsWith("/rider")) {
      return NextResponse.redirect(
        new URL("/driver/dashboard", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/complete-profile",
    "/",
    "/rider/:path*",
    "/driver/:path*",
  ],
};