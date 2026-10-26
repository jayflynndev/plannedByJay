import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { holidayFixture } from "./helpers/holiday-fixture";
import { supplierInput } from "../src/lib/suppliers/schema";
import { findSupplierDetails, structuredMatches, allowSupplierLookup } from "../src/lib/suppliers/lookup";
import { publicAddress, lookupUrl } from "../src/lib/suppliers/public-page";
import { supplierDatabaseError } from "../src/lib/suppliers/data";

test("supplier migration is private, duplicate-safe, re-runnable, versioned and archives stable records without altering the CMS", async () => {
  const {db, admin, other, run} = await holidayFixture();
  const migration = await readFile("supabase/migrations/20261026_suppliers_directory.sql", "utf8");
  type Row = {id: string; name: string; status: string; archived: boolean; version: number; legal_name: string; created_at: string};
  try {
    await db.exec(migration); await db.exec(migration);
    assert.equal((await db.query("select * from public.suppliers")).rows.length, 0);
    await assert.rejects(run("anon", "", "select * from public.suppliers"), /permission denied/);
    assert.equal((await run("authenticated", other, "select * from public.suppliers")).rows.length, 0);
    await assert.rejects(run("authenticated", other, "insert into public.suppliers(name) values('Blocked')"), /row-level security/);
    const draft = (await run<Row>("authenticated", admin, "insert into public.suppliers(name) values('Jet2holidays') returning *")).rows[0];
    assert.equal(draft.status, "draft"); assert.equal(draft.legal_name, ""); assert.equal(draft.version, 1);
    await assert.rejects(run("authenticated", admin, "insert into public.suppliers(name) values('  JET2HOLIDAYS  ')"), /unique/);
    const approved = (await run<Row>("authenticated", admin, "update public.suppliers set status='approved',legal_name='Test correction' where id=$1 and version=1 returning *", [draft.id])).rows[0];
    assert.equal(approved.id, draft.id); assert.equal(approved.status, "approved"); assert.equal(approved.version, 2);
    assert.equal((await run("authenticated", other, "select * from public.suppliers")).rows.length, 0);
    assert.equal((await run("authenticated", other, "update public.suppliers set name='Blocked' returning *")).rows.length, 0);
    assert.equal((await run("authenticated", admin, "update public.suppliers set name='Stale overwrite' where id=$1 and version=1 returning *", [draft.id])).rows.length, 0);
    const archived = (await run<Row>("authenticated", admin, "update public.suppliers set archived=true where id=$1 and version=2 returning *", [draft.id])).rows[0];
    assert.equal(archived.archived, true); assert.equal(archived.status, "approved");
    await assert.rejects(run("authenticated", admin, "insert into public.suppliers(name) values('jet2holidays')"), /unique/);
    await assert.rejects(run("authenticated", admin, "delete from public.suppliers where id=$1", [draft.id]), /permission denied/);
    const restored = (await run<Row>("authenticated", admin, "update public.suppliers set archived=false where id=$1 returning *", [draft.id])).rows[0];
    assert.equal(restored.id, draft.id); assert.equal(restored.archived, false); assert.equal(restored.legal_name, "Test correction");
    await db.exec(migration);
    assert.equal((await db.query<Row>("select * from public.suppliers")).rows[0].id, draft.id);
    assert.equal((await db.query<{count:number}>("select count(*)::int as count from public.holiday_types")).rows[0].count, 6);
    assert.equal((await db.query<{count:number}>("select count(*)::int as count from public.articles")).rows[0].count, 0);
    assert.equal((await db.query("select tablename from pg_tables where schemaname='public' and tablename ~ 'offer|enquir|approval|research'")).rows.length, 0);
  } finally {await db.close();}
});

test("supplier inputs accept incomplete drafts and explicit approval, reject unsafe URLs and explain duplicate records", () => {
  assert.equal(supplierInput.parse({name: "  Example   Travel  "}).name, "Example Travel");
  assert.equal(supplierInput.parse({name: "Example", status: "approved"}).status, "approved");
  assert.equal(supplierInput.safeParse({name: ""}).success, false);
  assert.equal(supplierInput.safeParse({name: "Example", website: "javascript:alert(1)"}).success, false);
  assert.equal(supplierInput.safeParse({name: "Example", contact_email: "wrong"}).success, false);
  assert.equal(supplierInput.safeParse({name: "Example", status: "pending"}).success, false);
  assert.throws(() => supplierDatabaseError({code: "23505"}), /already exists.*archived/);
});

test("supplier lookup extracts live-page evidence, leaves missing details blank, never claims register verification and handles ambiguous/no matches", async () => {
  const termsUrl = "https://www.jet2holidays.com/terms-and-conditions", contactUrl = "https://www.jet2holidays.com/contact-us";
  const requested: string[] = [];
  const result = await findSupplierDetails("Jet2holidays", "", async url => {
    requested.push(url);
    return {url, html: url === termsUrl ? "<h1>Booking conditions</h1><p>VIBE are trading names of Jet2holidays Limited.</p><p>We hold an Air Travel Organiser's Licence (ATOL number 9618).</p><p>Regulator email: claims@caa.co.uk</p>" : "<h1>Get in touch</h1>"};
  });
  assert.deepEqual(requested.sort(), [termsUrl, contactUrl].sort());
  const suggestions = result.matches[0].suggestions;
  assert.equal(suggestions.find(s => s.field === "legal_name")?.value, "Jet2holidays Limited");
  assert.equal(suggestions.find(s => s.field === "atol_number")?.value, "9618");
  assert.equal(suggestions.find(s => s.field === "atol_number")?.url, termsUrl);
  assert.equal(suggestions.find(s => s.field === "contact_url")?.value, contactUrl);
  assert.ok(!suggestions.some(s => s.field === "contact_email" || s.field === "business_address"));
  assert.match(result.message, /current CAA licence status has not been checked/);
  const ambiguous = await findSupplierDetails("Jet2", "", async () => {throw new Error("Should not fetch until chosen");});
  assert.equal(ambiguous.matches.length, 2); assert.ok(ambiguous.matches.every(m => m.suggestions.length === 1));
  const missing = await findSupplierDetails("Unknown supplier"); assert.equal(missing.matches.length, 0);
  const failure = await findSupplierDetails("Jet2holidays", "", async () => {throw new Error("Blocked");});
  assert.equal(failure.matches[0].suggestions.length, 1);
  assert.equal(failure.matches[0].suggestions[0].kind, "suggested");
  const changed = await findSupplierDetails("Jet2holidays", "", async url => ({url, html: "<p>New layout without reliably attributable company details</p>"}));
  assert.ok(!changed.matches[0].suggestions.some(s => /legal|atol/.test(s.field)));
});

test("structured lookup offers separate legal entities, explicit contact points and safe same-site links only", () => {
  const html = `<script type="application/ld+json">{"@graph":[
    {"@type":"Organization","name":"Test brand","legalName":"Test operating company","address":{"streetAddress":"Registered office only"},"contactPoint":{"contactType":"customer service","email":"contact@example.org","address":{"streetAddress":"Public contact address","postalCode":"TEST"}}},
    {"@type":"Organization","name":"Test parent","legalName":"Test parent company"}]}</script>
    <a href="/contact">Contact us</a><a href="/booking-conditions">Booking conditions</a><a href="javascript:alert(1)">Contact</a>`;
  const matches = structuredMatches(html, "https://example.org");
  assert.equal(matches.length, 2);
  assert.equal(matches[0].suggestions.find(s => s.field === "business_address")?.value, "Public contact address, TEST");
  assert.ok(!matches[1].suggestions.some(s => s.field === "business_address"));
  assert.equal(matches[0].suggestions.find(s => s.field === "contact_email")?.value, "contact@example.org");
  assert.equal(matches[0].suggestions.find(s => s.field === "booking_conditions_url")?.value, "https://example.org/booking-conditions");
  assert.ok(matches.flatMap(m => m.suggestions).every(s => s.kind === "suggested"));
  assert.equal(structuredMatches('<script type="application/ld+json">broken</script>', "https://example.org")[0].suggestions.length, 1);
});

test("public page lookup rejects internal hosts/addresses and rate-limits repeat requests", () => {
  for (const url of ["http://example.org", "https://127.0.0.1", "https://[::1]", "https://localhost", "https://local.internal", "https://example.org:8443", "https://user:password@example.org"]) assert.throws(() => lookupUrl(url));
  for (const ip of ["127.0.0.1", "10.1.1.1", "169.254.169.254", "100.100.100.200", "192.168.0.1", "::1", "::ffff:127.0.0.1", "fd00::1", "2001:db8::1", "2002:7f00:1::"]) assert.equal(publicAddress(ip), false, ip);
  assert.equal(publicAddress("8.8.8.8"), true); assert.equal(publicAddress("2606:4700:4700::1111"), true);
  for (let i = 0; i < 6; i++) assert.equal(allowSupplierLookup("fixture-admin", 1000), true);
  assert.equal(allowSupplierLookup("fixture-admin", 1001), false);
  assert.equal(allowSupplierLookup("fixture-admin", 62000), true);
});
