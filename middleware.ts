import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, isDemoSessionValue } from "@/lib/auth/demo";

const protectedPaths = ["/dashboard", "/journal", "/analytics", "/settings", "/admin"];

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function hasDemoSession(request: NextRequest) {
  return isDemoSessionValue(request.cookies.get(DEMO_COOKIE)?.value);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const demo = hasDemoSession(request);

  if (demo) {
    if (path === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (isProtected) {
      return NextResponse.next();
    }
    return NextResponse.next();
  }

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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
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
    "/login",
  ],
};
