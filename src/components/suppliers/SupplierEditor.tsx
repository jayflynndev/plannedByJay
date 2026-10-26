"use client";
import { useEffect, useRef, useState } from "react";
import { emptySupplier, supplierInput, supplierFields, specialisms, type Supplier, type SupplierField, type SupplierInput } from "@/lib/suppliers/schema";

export function SupplierEditor({initial}: {initial?: Supplier}) {
  const [value, setValue] = useState<SupplierInput>(() => initial ? supplierInput.parse(Object.fromEntries(Object.keys(emptySupplier()).map(k => [k, initial[k as keyof SupplierInput]]))) : emptySupplier());
  const [baseline, setBaseline] = useState(() => JSON.stringify(value));
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const working = useRef(false), dirty = JSON.stringify(value) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof SupplierInput>(key: K, next: SupplierInput[K]) {
    setValue(v => ({...v, [key]: next}));
    setMessage("");
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
  return <>
    <div className="article-admin-heading"><h1>{value.id ? "Edit Supplier" : "Add Supplier"}</h1><a href="/admin/suppliers">All Suppliers</a></div>
    <p>{dirty ? "Unsaved changes" : value.id ? "Saved" : "Not saved yet"}{initial?.archived ? " - Archived. Restore this record from the directory to use it again." : ""}</p>
    <fieldset disabled={!!busy} className="article-admin-form">
      <label>Supplier name<input value={value.name} required maxLength={120} onChange={e => change("name", e.target.value)}/></label>
      {(Object.keys(supplierFields) as SupplierField[]).map(key => <div key={key}>
        <label>{supplierFields[key]}{key === "business_address" ? <textarea rows={3} value={value[key]} maxLength={1000} onChange={e => change(key, e.target.value)}/> : <input value={value[key]} type={key === "contact_email" ? "email" : ["website", "contact_url", "booking_conditions_url"].includes(key) ? "url" : "text"} list={key === "specialism" ? "supplier-specialisms" : undefined} maxLength={key === "specialism" ? 80 : key === "atol_number" ? 10 : key === "contact_email" ? 320 : key === "legal_name" || key === "atol_holder" ? 200 : 2000} onChange={e => change(key, e.target.value)}/>}</label>
        {key === "business_address" && <small>Use the published business/contact address.</small>}
        {key === "contact_url" && <small>Enter a public contact email or an official contact-page URL; you do not need both.</small>}
        {key === "atol_number" && <small>Leave ATOL fields blank where they do not apply.</small>}
      </div>)}
      <datalist id="supplier-specialisms">{specialisms.map(s => <option key={s} value={s}/>)}</datalist>
      <label>Status<select value={value.status} onChange={e => change("status", e.target.value as SupplierInput["status"])}><option value="draft">Draft</option><option value="approved">Approved</option></select></label>
      <p>Approved means you have checked the supplier information and are happy to use it. Only the supplier name is required; incomplete records can be saved as Draft.</p>
      <div className="article-admin-actions"><button type="button" className="button button-secondary" onClick={() => void save("draft")}>Save Draft</button><button type="button" className="button" onClick={() => void save(value.status)}>{value.id ? "Save Changes" : "Save Supplier"}</button><a href="/admin/suppliers">Back to Suppliers</a></div>
      <div aria-live={failed ? "assertive" : "polite"} aria-atomic="true">{(busy || message) && <p role={failed ? "alert" : "status"} className={failed ? "article-admin-error" : "article-admin-notice"}>{busy || message}</p>}</div>
    </fieldset>
  </>;
}
