import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { suggestSlug, articleInput } from "../src/lib/articles/schema";
import { cleanHtml, bodyText, excerpt } from "../src/lib/articles/html";

test("deterministic short slugs, strict inputs and safe formatted content", () => {
  for (const [title, slug] of [
    ["Is booking through a travel agent more expensive?", "travel-agent-costs"],
    ["Tenerife vs Lanzarote", "tenerife-vs-lanzarote"],
    ["What is included in your first cruise?", "first-cruise-guide"],
    ["All-inclusive or self-catering?", "all-inclusive-vs-self-catering"],
    ["Planning an accessible holiday", "accessible-holiday-guide"],
  ])
    assert.equal(suggestSlug(title), slug);
  assert.ok(
    suggestSlug(
      "A very long detailed title about understanding the many choices of holiday planning",
    ).length <= 60,
  );
  assert.equal(articleInput.safeParse({ title: "", body: "" }).success, true);
  assert.equal(articleInput.safeParse({ slug: "../../admin" }).success, false);
  assert.equal(
    articleInput.safeParse({ featured_image: "https://evil.example/a.jpg" })
      .success,
    false,
  );
  const clean = cleanHtml(
    '<h2>Heading</h2><p><strong>Bold</strong> <em>italic</em> <u>underline</u></p><ol><li>One</li></ol><blockquote>Quote</blockquote><script>alert(1)</script><img src=x onerror=alert(2)><a href="javascript:alert(3)">Bad</a><a href="https://example.com" onclick="evil()">Good</a>',
  );
  assert.match(clean, /<h2>/);
  assert.match(clean, /<u>underline<\/u>/);
  assert.match(clean, /<ol>/);
  assert.match(clean, /<blockquote>/);
  assert.doesNotMatch(clean, /script|onerror|onclick|javascript:|<img/);
  assert.match(clean, /noopener/);
  assert.equal(bodyText("<p><br></p>"), "");
  assert.ok(
    excerpt("<p>" + "Useful travel advice. ".repeat(30) + "</p>").length <= 155,
  );
});

test("one migration: atomic draft/publish/tags, RLS, expiry, stable URLs, concurrency and image upload permissions", async () => {
  const db = new PGlite();
  const admin = randomUUID(),
    other = randomUUID(),
    unconfirmed = randomUUID();
  const run = async <T>(
    role: string,
    id: string,
    sql: string,
    args: unknown[] = [],
  ) => {
    await db.exec("begin");
    try {
      await db.exec("set local role " + role);
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
        id,
      ]);
      const r = await db.query<T>(sql, args);
      await db.exec("commit");
      return r;
    } catch (e) {
      await db.exec("rollback");
      throw e;
    }
  };
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,banned_until timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema auth,storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`,
    );
    await db.query(
      "insert into auth.users values($1,'jay@plannedbyjay.com',now(),null),($2,'ordinary@example.com',now(),null),($3,'jay@plannedbyjay.com',null,null)",
      [admin, other, unconfirmed],
    );
    await db.exec(
      await readFile("supabase/migrations/20261025_articles_cms.sql", "utf8"),
    );
    const save = async (p: Record<string, unknown>, tags: string[] = []) =>
      (
        await run<{ a: Record<string, unknown> }>(
          "authenticated",
          admin,
          "select public.save_article($1,$2) a",
          [p, tags],
        )
      ).rows[0].a;
    await assert.rejects(
      run("anon", "", "select public.save_article($1,$2)", [{}, []]),
      /permission denied/,
    );
    await assert.rejects(
      run("authenticated", other, "select public.save_article($1,$2)", [
        {},
        [],
      ]),
      /Administrator/,
    );
    await assert.rejects(
      run("authenticated", unconfirmed, "select public.save_article($1,$2)", [
        {},
        [],
      ]),
      /Administrator/,
    );
    let article = await save(
      {
        title: "",
        slug: "travel-agent-costs",
        body: "",
        status: "draft",
        author: "Jay",
      },
      ["Travel agents", "travel AGENTS", "Family holidays"],
    );
    assert.equal(article.status, "draft");
    assert.equal((article.tags as string[]).length, 2);
    assert.ok(article.created_at);
    assert.ok(article.updated_at);
    assert.equal(
      (await run("anon", "", "select * from public.articles")).rows.length,
      0,
    );
    assert.equal(
      (await run("anon", "", "select * from public.article_tags")).rows.length,
      0,
    );
    assert.equal(
      (await run("anon", "", "select * from public.article_categories")).rows
        .length,
      0,
    );
    await assert.rejects(
      save({ ...article, title: "Test", body: "", status: "published" }),
      /check constraint/,
    );
    article = await save(
      {
        ...article,
        title: "Is booking through a travel agent more expensive?",
        body: "<h2>Research</h2><p><strong>Useful advice</strong></p>",
        excerpt: "Useful advice",
        status: "published",
      },
      ["Travel agents"],
    );
    assert.equal(article.status, "published");
    assert.ok(article.published_at);
    assert.equal(
      (
        await run("anon", "", "select * from public.articles where slug=$1", [
          "travel-agent-costs",
        ])
      ).rows.length,
      1,
    );
    assert.equal(
      (await run("anon", "", "select * from public.article_categories")).rows
        .length,
      1,
    );
    assert.equal(
      (await run("anon", "", "select * from public.article_tags")).rows.length,
      1,
    );
    const originalSlug = article.slug,
      created = article.created_at,
      published = article.published_at;
    article = await save({ ...article, title: "Edited headline" });
    assert.equal(article.slug, originalSlug);
    assert.equal(article.created_at, created);
    assert.equal(article.published_at, published);
    await assert.rejects(
      save({ ...article, slug: "changed-shared-url" }),
      /permanent/,
    );
    await assert.rejects(save({ ...article, version: 0 }), /changed elsewhere/);
    await assert.rejects(
      save({
        title: "Other",
        slug: originalSlug,
        body: "Text",
        status: "published",
      }),
      /unique constraint/,
    );
    const today = (
      await db.query<{ expiry_day: string }>(
        "select to_char(now() at time zone 'Europe/London','YYYY-MM-DD') as expiry_day",
      )
    ).rows[0].expiry_day;
    article = await save({ ...article, expires_on: today }, ["Travel agents"]);
    assert.equal(
      (await run("anon", "", "select id from public.articles")).rows.length,
      1,
    );
    article = await save({ ...article, expires_on: "2000-01-01" }, [
      "Private expired tag",
    ]);
    assert.equal(
      (await run("anon", "", "select id from public.articles")).rows.length,
      0,
    );
    assert.equal(
      (await run("anon", "", "select id from public.article_tags")).rows.length,
      0,
    );
    assert.equal(
      (await run("authenticated", admin, "select id from public.articles")).rows
        .length,
      1,
    );
    article = await save({ ...article, expires_on: "", status: "draft" });
    assert.equal(
      (await run("anon", "", "select id from public.articles")).rows.length,
      0,
    );
    await assert.rejects(
      run(
        "authenticated",
        other,
        "insert into public.article_categories(name) values('Forbidden')",
      ),
      /row-level security/,
    );
    await run(
      "authenticated",
      admin,
      "insert into public.article_categories(name) values('Cruise Advice')",
    );
    await assert.rejects(
      run(
        "authenticated",
        admin,
        "insert into public.article_categories(name) values(' cruise ADVICE ')",
      ),
      /unique constraint/,
    );
    const file = randomUUID() + "-coast.webp";
    await run(
      "authenticated",
      admin,
      "insert into storage.objects(bucket_id,name) values($1,$2)",
      ["article-images", file],
    );
    await assert.rejects(
      run(
        "authenticated",
        other,
        "insert into storage.objects(bucket_id,name) values($1,$2)",
        ["article-images", randomUUID() + "-bad.webp"],
      ),
      /row-level security/,
    );
    assert.equal(
      (await run("anon", "", "select * from storage.objects")).rows.length,
      0,
    );
    await run(
      "authenticated",
      admin,
      "delete from public.articles where id=$1",
      [article.id],
    );
    assert.equal(
      (await run("anon", "", "select id from public.articles")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.article_tag_links")).rows.length,
      0,
    );
    await db.query(
      "update auth.users set banned_until=now()+interval '1 day' where id=$1",
      [admin],
    );
    await assert.rejects(
      save({ slug: "banned", status: "draft" }),
      /Administrator/,
    );
  } finally {
    await db.close();
  }
});

test("photo pipeline decodes real images, bounds size and strips metadata", async () => {
  const sharp = (await import("sharp")).default;
  const { preparePhoto } = await import("../src/lib/articles/media");
  const input = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "green" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  const output = await preparePhoto(input);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 2000);
  assert.equal(meta.height, 1000);
  assert.equal(meta.exif, undefined);
  await assert.rejects(
    preparePhoto(Buffer.from('<svg onload="alert(1)"></svg>')),
  );
});
