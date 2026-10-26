"use client";
import { useEffect, useRef, useState } from "react";
import { emptySupplier, supplierInput, supplierFields, specialisms, sourceLabel, type Supplier, type SupplierField, type SupplierInput } from "@/lib/suppliers/schema";
import type { LookupResult, Suggestion } from "@/lib/suppliers/lookup";

export function SupplierEditor({initial}: {initial?: Supplier}) {
  const [value, setValue] = useState<SupplierInput>(() => initial ? supplierInput.parse(Object.fromEntries(Object.keys(emptySupplier()).map(k => [k, initial[k as keyof SupplierInput]]))) : emptySupplier());
  const [baseline, setBaseline] = useState(() => JSON.stringify(value));
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null), [selected, setSelected] = useState(-1);
  const working = useRef(false), dirty = JSON.stringify(value) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof SupplierInput>(key: K, next: SupplierInput[K]) {
    setValue(v => {
      const sources = {...v.sources};
      if (key in supplierFields) delete sources[key as SupplierField];
      return {...v, [key]: next, sources};
    });
    if (key === "name" || key === "website") {setLookup(null); setSelected(-1);}
    setMessage("");
  }
  function accept(suggestion: Suggestion) {
    const current = value[suggestion.field];
    if (current && current !== suggestion.value && !window.confirm(`Replace your existing ${supplierFields[suggestion.field].toLowerCase()} entry with this suggestion?`)) return;
    setValue(v => ({...v, [suggestion.field]: suggestion.value, sources: {...v.sources, [suggestion.field]: {value: suggestion.value, url: suggestion.url, kind: suggestion.kind}}}));
    setMessage("Suggestion accepted in the form. Save Supplier to store your changes."); setFailed(false);
  }
  function acceptEmpty() {
    if (!lookup || selected < 0) return;
    setValue(v => {
      const next = {...v, sources: {...v.sources}};
      for (const suggestion of lookup.matches[selected].suggestions) if (!next[suggestion.field]) {
        next[suggestion.field] = suggestion.value;
        next.sources[suggestion.field] = {value: suggestion.value, url: suggestion.url, kind: suggestion.kind};
      }
      return next;
    });
    setFailed(false); setMessage("Suggestions filled empty fields only. Review them and save when ready.");
  }
  async function findDetails() {
    if (working.current) return;
    if (!value.name.trim()) {setFailed(true); setMessage("Enter a supplier name before looking up details."); return;}
    working.current = true; setBusy("Finding supplier details..."); setMessage(""); setFailed(false); setLookup(null); setSelected(-1);
    try {
      const r = await fetch("/api/suppliers/lookup", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: value.name, website: value.website})});
      const data: LookupResult & {error?: string} = await r.json();
      if (!r.ok) throw new Error(data.error || "Lookup is unavailable. You can complete the form manually.");
      setLookup(data); setSelected(data.matches.length === 1 ? 0 : -1);
    } catch (e) {setFailed(true); setMessage(e instanceof Error ? e.message : "Lookup failed. Your entries are unchanged; you can continue manually.");}
    finally {working.current = false; setBusy("");}
  }
  async function save(status: SupplierInput["status"]) {
    if (working.current) return;
    working.current = true; setBusy("Saving supplier..."); setMessage(""); setFailed(false);
    try {
      const p = supplierInput.safeParse({...value, status});
      if (!p.success) throw new Error(p.error.issues.map(i => i.message).join(" "));
      const r = await fetch("/api/suppliers", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(p.data)});
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed. Your entries are retained.");
      const next = supplierInput.parse(Object.fromEntries(Object.keys(emptySupplier()).map(k => [k, data.supplier[k]])));
      setValue(next); setBaseline(JSON.stringify(next));
      window.history.replaceState(null, "", `/admin/suppliers/${next.id}/edit`);
      setMessage(status === "draft" ? "Supplier draft saved successfully." : "Supplier saved successfully. Status: Approved.");
    } catch (e) {setFailed(true); setMessage(e instanceof Error ? e.message : "Save failed. Your entries are retained.");}
    finally {working.current = false; setBusy("");}
  }
  const match = lookup && selected >= 0 ? lookup.matches[selected] : null;
  return <>
    <div className="article-admin-heading"><h1>{value.id ? "Edit Supplier" : "Add Supplier"}</h1><a href="/admin/suppliers">All Suppliers</a></div>
    <p>{dirty ? "Unsaved changes" : value.id ? "Saved" : "Not saved yet"}{initial?.archived ? " - Archived. Restore this record from the directory to use it again." : ""}</p>
    <fieldset disabled={!!busy} className="article-admin-form">
      <label>Supplier name<input value={value.name} required maxLength={120} onChange={e => change("name", e.target.value)}/></label>
      <div><button type="button" className="button button-secondary" onClick={() => void findDetails()}>{busy === "Finding supplier details..." ? busy : "Find Supplier Details"}</button><p>Jet2holidays can be found by name. For other suppliers, enter their official HTTPS website first. Available suggestions need your review; some websites may block lookup.</p></div>
      {lookup && <section className="supplier-lookup" aria-label="Supplier details suggestions">
        <p role="status">{lookup.message}</p>
        {lookup.matches.length > 1 && <fieldset><legend>Choose the correct supplier / legal entity</legend>{lookup.matches.map((m, index) => <label key={index} className="supplier-choice"><input type="radio" name="supplier-match" value={index} checked={selected === index} onChange={() => setSelected(index)}/>{m.name}</label>)}</fieldset>}
        {match && <><h2>{match.name}</h2><button type="button" onClick={acceptEmpty}>Fill empty fields with suggestions</button>
          <ul className="supplier-suggestions">{match.suggestions.map(s => <li key={s.field}><strong>{supplierFields[s.field]}</strong><p>{s.value}</p><p>{sourceLabel(s.kind)} · <a href={s.url} target="_blank" rel="noopener noreferrer">Source</a></p><button type="button" aria-label={`Use suggested ${supplierFields[s.field].toLowerCase()}`} onClick={() => accept(s)}>Use suggestion</button></li>)}</ul>
          <p>Not found: {(Object.keys(supplierFields) as SupplierField[]).filter(k => !match.suggestions.some(s => s.field === k)).map(k => supplierFields[k]).join(", ") || "None of these fields"}.</p>
        </>}
        <p>No information is confirmed against an authoritative register by this lookup. Current CAA licence status is not checked. Lookup never approves or saves a supplier.</p>
      </section>}
      {(Object.keys(supplierFields) as SupplierField[]).map(key => <div key={key}>
        <label>{supplierFields[key]}{key === "business_address" ? <textarea rows={3} value={value[key]} maxLength={1000} onChange={e => change(key, e.target.value)}/> : <input value={value[key]} type={key === "contact_email" ? "email" : ["website", "contact_url", "booking_conditions_url"].includes(key) ? "url" : "text"} list={key === "specialism" ? "supplier-specialisms" : undefined} maxLength={key === "specialism" ? 80 : key === "atol_number" ? 10 : key === "contact_email" ? 320 : key === "legal_name" || key === "atol_holder" ? 200 : 2000} onChange={e => change(key, e.target.value)}/>}</label>
        {value.sources[key] && <small>{sourceLabel(value.sources[key]!.kind)} · <a href={value.sources[key]!.url} target="_blank" rel="noopener noreferrer">Source for {supplierFields[key].toLowerCase()}</a></small>}
        {key === "business_address" && <small>Use the published business/contact address. A registered office is not automatically a customer contact address.</small>}
        {key === "contact_url" && <small>A checked official contact-page link can be used when no general public email is published.</small>}
        {key === "atol_number" && <small>Where applicable. These supplier details do not establish protection for every holiday product or confirm current CAA licence status.</small>}
      </div>)}
      <datalist id="supplier-specialisms">{specialisms.map(s => <option key={s} value={s}/>)}</datalist>
      <label>Status<select value={value.status} onChange={e => change("status", e.target.value as SupplierInput["status"])}><option value="draft">Draft</option><option value="approved">Approved</option></select></label>
      <p>Approved means you have reviewed this supplier record and are happy to use the information. It is not a separate New Travel approval process. Only the supplier name is required; incomplete records can be saved as Draft.</p>
      <div className="article-admin-actions"><button type="button" className="button button-secondary" onClick={() => void save("draft")}>Save Draft</button><button type="button" className="button" onClick={() => void save(value.status)}>{value.id ? "Save Changes" : "Save Supplier"}</button><a href="/admin/suppliers">Back to Suppliers</a></div>
      <div aria-live={failed ? "assertive" : "polite"} aria-atomic="true">{(busy || message) && <p role={failed ? "alert" : "status"} className={failed ? "article-admin-error" : "article-admin-notice"}>{busy || message}</p>}</div>
    </fieldset>
  </>;
}
