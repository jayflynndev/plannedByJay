import test from "node:test";
import assert from "node:assert/strict";
import { holidayFixture } from "./helpers/holiday-fixture";
const marker = require.resolve("server-only");
require.cache[marker] = {exports: {}, id: marker, filename: marker, loaded: true} as NodeModule;

test("Holiday Type routes, homepage, metadata and sitemap follow published database changes without exposing drafts", async () => {
  const {db, admin, run} = await holidayFixture();
  const originalFetch = globalThis.fetch;
  const keys = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SITE_URL"];
  const old = keys.map(k => process.env[k]);
  Object.assign(process.env, {SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture", SITE_URL: "https://plannedbyjay.com"});
  const requests: {url: URL; cache?: RequestCache; auth: string | null}[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    requests.push({url, cache: init?.cache, auth: new Headers(init?.headers).get("Authorization")});
    if (url.pathname.endsWith("holiday_types")) {
      const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
      const rows = (await run("anon", "", "select * from public.holiday_types" + (slug ? " where slug=$1" : "") + " order by display_order,created_at,id", slug ? [slug] : [])).rows;
      return Response.json(rows);
    }
    return Response.json([], {headers: {"Content-Range": "0-0/0"}});
  };
  try {
    const {default: Listing} = await import("../src/app/holidays/page");
    const {default: Detail, generateMetadata} = await import("../src/app/holidays/[slug]/page");
    const {default: Home} = await import("../src/app/page");
    const {default: sitemap} = await import("../src/app/sitemap");
    const slugs = ["family", "cruises", "couples", "city-breaks", "something-different", "accessible"];
    assert.deepEqual((await Listing()).props.holidays.map((h: {slug:string}) => h.slug), slugs);
    const props = {params: Promise.resolve({slug: "family"})};
    const first = await Detail(props);
    assert.equal(first.props.holiday.image, "/images/destinations/family.jpg");
    await run("authenticated", admin, "update public.holiday_types set introduction='Updated family plans.' where slug='family'");
    assert.equal((await Detail(props)).props.holiday.introduction, "Updated family plans.");
    const meta = await generateMetadata(props);
    assert.equal(meta.description, "Updated family plans.");
    assert.equal(meta.openGraph?.description, meta.description);
    assert.equal(meta.alternates?.canonical, "https://plannedbyjay.com/holidays/family");
    assert.ok(JSON.stringify(meta.openGraph).includes("family.jpg"));
    const draft = (await run("authenticated", admin, "insert into public.holiday_types(name,slug,heading,body) values('All-Inclusive','all-inclusive','All-Inclusive','<h2>Useful details</h2><p>Helpful content.</p>') returning *")).rows[0];
    await assert.rejects(Detail({params: Promise.resolve({slug: draft.slug})}), /NEXT_HTTP_ERROR_FALLBACK;404/);
    await assert.rejects(generateMetadata({params: Promise.resolve({slug: draft.slug})}), /NEXT_HTTP_ERROR_FALLBACK;404/);
    assert.equal((await Listing()).props.holidays.length, 6);
    assert.ok(!(await sitemap()).some(s => s.url.endsWith("/all-inclusive")));
    await run("authenticated", admin, "update public.holiday_types set status='published' where id=$1", [draft.id]);
    assert.deepEqual((await Listing()).props.holidays.map((h: {slug:string}) => h.slug), [...slugs, "all-inclusive"]);
    assert.equal((await Detail({params: Promise.resolve({slug: draft.slug})})).props.holiday.name, "All-Inclusive");
    const home = await Home();
    const cards = home.props.children.find((c: {props:{holidays?: unknown[]}}) => c.props.holidays).props.holidays;
    assert.equal(cards.length, 7); assert.equal(cards[0].introduction, "Updated family plans.");
    assert.ok((await sitemap()).some(s => s.url.endsWith("/holidays/all-inclusive") && s.lastModified));
    await run("authenticated", admin, "update public.holiday_types set status='draft' where id=$1", [draft.id]);
    await assert.rejects(Detail({params: Promise.resolve({slug: draft.slug})}), /NEXT_HTTP_ERROR_FALLBACK;404/);
    assert.ok(!(await sitemap()).some(s => s.url.endsWith("/all-inclusive")));
    assert.ok(requests.every(r => r.cache === "no-store"));
    assert.ok(requests.every(r => !r.auth || r.auth === "Bearer sb_publishable_fixture"));
    globalThis.fetch = async () => Response.json({message: "Fixture unavailable", code: "503"}, {status: 503});
    assert.equal((await Listing()).props.unavailable, true);
  } finally {globalThis.fetch = originalFetch; keys.forEach((k, i) => {if (old[i] === undefined) delete process.env[k]; else process.env[k] = old[i];}); await db.close();}
});
