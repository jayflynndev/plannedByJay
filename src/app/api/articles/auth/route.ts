import {
  checkOrigin,
  sessionClient,
  requireAdmin,
  readJson,
  failure,
  ArticleError,
} from "@/lib/articles/client";
import { ADMIN_EMAIL } from "@/lib/articles/schema";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readJson(request);
    const client = await sessionClient();
    if (body.action === "logout") {
      await client.auth.signOut({ scope: "local" });
      return Response.json(
        { ok: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (
      typeof body.email !== "string" ||
      body.email.trim().toLowerCase() !== ADMIN_EMAIL ||
      typeof body.password !== "string" ||
      body.password.length > 256
    )
      throw new ArticleError(
        "Sign-in failed. Check the business account and password.",
        401,
      );
    const result = await client.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });
    if (result.error)
      throw new ArticleError(
        "Sign-in failed. Check the password and confirm the account in Supabase.",
        401,
      );
    try {
      await requireAdmin(client);
    } catch (e) {
      await client.auth.signOut({ scope: "local" });
      throw e;
    }
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
