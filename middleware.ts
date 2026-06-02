import { getProfileAccess } from "@/lib/auth/profile";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/journal", "/analytics", "/settings", "/admin"];

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isSuspendedPage = path.startsWith("/account-suspended");

  if (!supabaseConfigured()) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login?setup=supabase", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (path === "/login" && user) {
    const access = await getProfileAccess(user.id);
    const isAdmin = access?.role === "admin" && access.is_active !== false;
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin" : "/dashboard", request.url)
    );
  }

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((isProtected || isSuspendedPage) && user) {
    const profile =
      (await getProfileAccess(user.id)) ??
      (
        await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", user.id)
          .maybeSingle()
      ).data;

    if (profile?.is_active === false && !isSuspendedPage) {
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    }
    if (profile?.is_active !== false && isSuspendedPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path.startsWith("/admin") && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/journal/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/account-suspended",
    "/login",
  ],
};
