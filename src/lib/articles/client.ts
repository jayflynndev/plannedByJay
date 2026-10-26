import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_EMAIL } from "./schema";
export class ArticleError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function articleConfig() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) return null;
  try {
    const origin = new URL(url);
    if (origin.protocol !== "https:") return null;
    return { url: origin.origin, key };
  } catch {
    return null;
  }
}
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
export function publicArticlesClient() {
  const c = articleConfig();
  return c
    ? createClient(c.url, c.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;
}
export async function sessionClient() {
  const c = articleConfig();
  if (!c)
    throw new ArticleError(
      "Articles setup is incomplete. See docs/ARTICLES.md.",
      503,
    );
  const jar = await cookies();
  return createServerClient(c.url, c.key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (entries) => {
        try {
          for (const e of entries) jar.set(e.name, e.value, e.options);
        } catch {
          /* The admin proxy refreshes cookies during server rendering. */
        }
      },
    },
  });
}
export async function requireAdmin(
  client: Awaited<ReturnType<typeof sessionClient>>,
) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new ArticleError("Sign in to manage articles.", 401);
  if (
    data.user.email?.toLowerCase() !== ADMIN_EMAIL ||
    !data.user.email_confirmed_at
  )
    throw new ArticleError("This account cannot manage articles.", 403);
  return data.user;
}
export async function adminClient() {
  const c = await sessionClient();
  await requireAdmin(c);
  return c;
}
export async function pageAdmin() {
  try {
    return await adminClient();
  } catch (e) {
    if (e instanceof ArticleError && e.status === 401) {
      const { redirect } = await import("next/navigation");
      redirect("/admin/login");
    }
    throw e;
  }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next may normalise request.url to localhost behind the local production server.
  // Host is the browser-facing request authority; never trust an arbitrary forwarded host.
  const url = new URL(request.url);
  const hostOrigin = request.headers.get("host")
    ? `${url.protocol}//${request.headers.get("host")}`
    : url.origin;
  if (!origin || (origin !== url.origin && origin !== hostOrigin))
    throw new ArticleError("Refresh this page before trying again.", 403);
}
export async function writeClient(request: Request) {
  checkOrigin(request);
  return adminClient();
}
export function databaseError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return;
  if (error.code === "23505")
    throw new ArticleError(
      "That URL is already used. Choose a different article URL.",
      409,
    );
  if (error.code === "40001")
    throw new ArticleError(
      "This article changed in another tab. Copy your edits before reloading.",
      409,
    );
  if (error.code === "42501")
    throw new ArticleError(
      "This account is not authorised for this action.",
      403,
    );
  throw new ArticleError(
    "The article could not be saved. Your unsaved work is retained; check setup or try again.",
    503,
  );
}
export async function readJson(request: Request) {
  const text = await request.text();
  if (text.length > 180000)
    throw new ArticleError("The article is too long.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ArticleError("Invalid request. Refresh and try again.");
  }
}
export function failure(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof ArticleError
          ? e.message
          : "The request failed. Your unsaved work is retained.",
    },
    {
      status: e instanceof ArticleError ? e.status : 500,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
