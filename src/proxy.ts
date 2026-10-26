import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { articleConfig, cookieOptions } from "@/lib/articles/client";
export async function proxy(request: NextRequest) {
  const c = articleConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!c) return response;
  const client = createServerClient(c.url, c.key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) => {
        for (const e of entries) request.cookies.set(e.name, e.value);
        response = NextResponse.next({ request });
        for (const e of entries)
          response.cookies.set(e.name, e.value, e.options);
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  await client.auth.getUser();
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
