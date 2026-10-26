import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { holidayFixture } from "./helpers/holiday-fixture";
import { supplierInput } from "../src/lib/suppliers/schema";
import { supplierDatabaseError, supplierRecord } from "../src/lib/suppliers/data";

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
  const existing = supplierRecord({...supplierInput.parse({name: "Existing supplier", legal_name: "Existing company", contact_url: "https://example.org/contact"}),
    id: "50000000-0000-4000-8000-000000000001", archived: false, created_at: "2026-10-26", updated_at: "2026-10-26", sources: {legacy: {value: "Old metadata"}}});
  assert.equal(existing.legal_name, "Existing company");
  assert.equal(existing.contact_url, "https://example.org/contact");
  assert.equal("sources" in existing, false);
});
