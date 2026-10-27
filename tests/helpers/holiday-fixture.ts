import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { HolidayType } from "../../src/lib/holiday-types/schema";
export const holidaySql = () => readFile("supabase/migrations/20261026_holiday_types_cms.sql", "utf8");
export async function holidayFixture() {
  const db = new PGlite(), admin = randomUUID(), other = randomUUID();
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,banned_until timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;grant usage on schema auth,storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`);
  await db.query("insert into auth.users values($1,'jay@plannedbyjay.com',now(),null),($2,'other@example.com',now(),null)", [admin, other]);
  await db.exec(await readFile("supabase/migrations/20261025_articles_cms.sql", "utf8"));
  await db.exec(await readFile("supabase/migrations/20261027_article_placement.sql", "utf8"));
  await db.exec(await holidaySql());
  async function run<T = HolidayType>(role: "anon" | "authenticated", id: string, sql: string, args: unknown[] = []) {
    await db.exec("begin");
    try {
      await db.exec("set local role " + role);
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
      const r = await db.query<T>(sql, args);
      await db.exec("commit"); return r;
    } catch (e) {await db.exec("rollback"); throw e;}
  }
  return {db, admin, other, run};
}
