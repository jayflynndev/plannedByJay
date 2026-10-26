"use client";
import { useRef, useState } from "react";
import type { Supplier } from "@/lib/suppliers/schema";

export function SupplierDirectory({initial}: {initial: Supplier[]}) {
  const [suppliers, setSuppliers] = useState(initial), [query, setQuery] = useState(""), [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(""), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const matches = suppliers.filter(s => (showArchived || !s.archived) && [s.name, s.specialism, s.website].some(v => v.toLocaleLowerCase("en-GB").includes(query.trim().toLocaleLowerCase("en-GB"))));
  async function archive(supplier: Supplier) {
    if (saving.current) return;
    const archived = !supplier.archived;
    if (!window.confirm(archived ? `Archive ${supplier.name}? Its saved information and references will be retained.` : `Restore ${supplier.name} to the directory?`)) return;
    saving.current = true; setBusy(supplier.id); setFailed(false); setMessage(archived ? "Archiving supplier..." : "Restoring supplier...");
    try {
      const r = await fetch("/api/suppliers", {method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: supplier.id, version: supplier.version, archived})});
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "The supplier could not be updated.");
      setSuppliers(items => items.map(s => s.id === data.supplier.id ? data.supplier : s));
      setMessage(archived ? "Supplier archived. Its information has been retained." : "Supplier restored successfully.");
    } catch (e) {setFailed(true); setMessage(e instanceof Error ? e.message : "The request failed.");}
    finally {saving.current = false; setBusy("");}
  }
  return <>
    <div className="article-admin-heading"><h1>Suppliers</h1><a className="button" href="/admin/suppliers/new">Add Supplier</a></div>
    <label>Search suppliers<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search saved suppliers"/></label>
    <p>Search saved supplier names, websites and specialisms.</p>
    <label className="supplier-archive-toggle"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)}/>Include archived suppliers</label>
    <div aria-live="polite">{message && <p role={failed ? "alert" : "status"} className={failed ? "article-admin-error" : "article-admin-notice"}>{message}</p>}</div>
    {!suppliers.length ? <p>No suppliers added yet.</p> : !matches.length ? <p>No suppliers match this search. Try another name or include archived suppliers.</p> : <ul className="article-admin-list">{matches.map(s => <li key={s.id}>
      <h2>{s.name}</h2><p>{s.status === "approved" ? "Approved" : "Draft"}{s.archived ? " - Archived" : ""}{s.specialism ? " - " + s.specialism : ""}</p>
      {s.website && <p><a href={s.website} target="_blank" rel="noopener noreferrer">{s.website}</a></p>}
      <div className="article-admin-actions"><a href={`/admin/suppliers/${s.id}/edit`}>Edit</a><button type="button" disabled={!!busy} onClick={() => void archive(s)}>{busy === s.id ? "Please wait..." : s.archived ? "Restore" : "Archive"}</button></div>
    </li>)}</ul>}
  </>;
}
