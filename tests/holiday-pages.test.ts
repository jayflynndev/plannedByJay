import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { holidayFixture, holidaySql } from "./helpers/holiday-fixture";
import originals from "./helpers/holiday-originals.json";
import { holidayInput, holidaySlug } from "../src/lib/holiday-types/schema";
import { holidayMetadata } from "../src/lib/holiday-metadata";
import { navigation } from "../src/content/navigation";

test("Holiday Types migration preserves all six originals, is re-runnable, enforces RLS, protects URLs/deletion and supports publication", async () => {
  const {db, admin, other, run} = await holidayFixture();
  try {
    const initial = (await run("anon", "", "select * from public.holiday_types order by display_order")).rows;
    assert.equal(initial.length, 6);
    for (const [index, h] of initial.entries()) {
      const {bodyHash, ...expected} = originals[index];
      for (const [key, value] of Object.entries(expected)) assert.equal(h[key as keyof typeof h], value);
      assert.equal(createHash("sha256").update(h.body).digest("hex"), bodyHash);
      await access("public" + h.image); assert.equal(h.is_original, true);
      assert.doesNotMatch(h.body, /common questions|<details|Can you guarantee that somewhere/i);
      const meta = holidayMetadata("https://plannedbyjay.com", {...h, photoUrl: h.image});
      assert.equal(meta.alternates?.canonical, `https://plannedbyjay.com/holidays/${h.slug}`);
      assert.equal(meta.description, h.introduction);
    }
    await db.exec(await holidaySql());
    assert.deepEqual((await run("anon", "", "select * from public.holiday_types order by display_order")).rows, initial);
    await assert.rejects(run("anon", "", "insert into public.holiday_types(slug) values('blocked')"), /permission denied/);
    await assert.rejects(run("authenticated", other, "insert into public.holiday_types(slug) values('blocked')"), /row-level security/);
    assert.equal((await run("authenticated", other, "update public.holiday_types set name='Blocked' returning *")).rows.length, 0);
    const family = initial[0];
    const updated = (await run("authenticated", admin, "update public.holiday_types set introduction='Updated family introduction.' where id=$1 returning *", [family.id])).rows[0];
    assert.equal(updated.slug, "family"); assert.equal(updated.version, 2);
    await db.exec(await holidaySql());
    assert.equal((await db.query<{introduction:string}>("select introduction from public.holiday_types where id=$1", [family.id])).rows[0].introduction, updated.introduction);
    await run("authenticated", admin, "update public.holiday_types set status='draft' where id=$1", [family.id]);
    assert.equal((await run("anon", "", "select * from public.holiday_types where slug='family'")).rows.length, 0);
    await assert.rejects(run("authenticated", admin, "update public.holiday_types set slug='renamed' where id=$1", [family.id]), /permanent/);
    await assert.rejects(run("authenticated", admin, "delete from public.holiday_types where id=$1", [family.id]), /cannot be deleted/);
    const draft = (await run("authenticated", admin, "insert into public.holiday_types(name,slug,heading,body) values('All-Inclusive','all-inclusive','All-Inclusive','<p>A useful introduction.</p>') returning *")).rows[0];
    assert.equal(draft.is_original, false);
    assert.equal((await run("anon", "", "select * from public.holiday_types where id=$1", [draft.id])).rows.length, 0);
    const published = (await run("authenticated", admin, "update public.holiday_types set status='published' where id=$1 and version=$2 returning *", [draft.id, draft.version])).rows[0];
    assert.ok(published.published_at);
    assert.equal((await run("authenticated", admin, "update public.holiday_types set name='Stale edit' where id=$1 and version=$2 returning *", [draft.id, draft.version])).rows.length, 0);
    assert.equal((await run("anon", "", "select * from public.holiday_types where slug='all-inclusive'")).rows.length, 1);
    await assert.rejects(run("authenticated", admin, "update public.holiday_types set slug='changed' where id=$1", [draft.id]), /permanent/);
    await assert.rejects(run("authenticated", admin, "insert into public.holiday_types(slug) values('all-inclusive')"), /unique/);
    await run("authenticated", admin, "delete from public.holiday_types where id=$1", [draft.id]);
    assert.equal((await run("anon", "", "select * from public.holiday_types where slug='all-inclusive'")).rows.length, 0);
    assert.equal((await db.query<{count:number}>("select count(*)::int as count from public.articles")).rows[0].count, 0);
    assert.equal((await db.query("select tablename from pg_tables where schemaname='public' and tablename ~ 'offer|supplier|enquir|faq'")).rows.length, 0);
  } finally {await db.close();}
});

test("Holiday Types use one published data source, safe inputs, short slugs and the existing admin/auth/editor", async () => {
  for (const [name, slug] of [["All-Inclusive", "all-inclusive"], ["Solo Holidays", "solo"], ["Ski Holidays", "ski"], ["UK Breaks", "uk-breaks"]]) assert.equal(holidaySlug(name), slug);
  assert.equal(holidayInput.safeParse({slug: "../admin"}).success, false);
  assert.equal(holidayInput.safeParse({image: "https://untrusted.example/image.jpg"}).success, false);
  assert.equal(holidayInput.safeParse({is_original: false}).success, false);
  assert.equal(navigation.find(n => n.label === "Holiday Types")?.href, "/holidays");
  const content = await readFile("src/content/holiday-types.ts", "utf8");
  assert.doesNotMatch(content, /export const holidayTypes|questionsTitle/);
  const layout = await readFile("src/app/admin/(articles)/layout.tsx", "utf8");
  assert.match(layout, /pageAdmin\(\)/); assert.match(layout, /\/admin\/holiday-types/);
  const editor = await readFile("src/components/holidays/HolidayTypeEditor.tsx", "utf8");
  assert.match(editor, /components\/articles\/VisualEditor/); assert.match(editor, /components\/articles\/ImageSelector/);
});
