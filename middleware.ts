import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSessionCookie = request.cookies.get("alyshop_admin_session")?.value;
    const hasSbToken = request.cookies
      .getAll()
      .some((c) => c.name.includes("auth-token") || c.name.includes("access-token"));

    if (!adminSessionCookie && !hasSbToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
