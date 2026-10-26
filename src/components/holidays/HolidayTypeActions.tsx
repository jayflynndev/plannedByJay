"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function HolidayTypeActions({holiday}: {holiday: {id: string; name: string; status: string; version: number; is_original: boolean}}) {
  const router = useRouter(), saving = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const [removed, setRemoved] = useState(false), [unpublished, setUnpublished] = useState(false);
  async function act(method: "PATCH" | "DELETE") {
    if (saving.current) return;
    if (!window.confirm(method === "DELETE" ? `Delete ${holiday.name}? This cannot be undone.` : `Unpublish ${holiday.name}? It will no longer appear publicly.`)) return;
    saving.current = true; setBusy(true); setFailed(false); setMessage(method === "DELETE" ? "Deleting..." : "Unpublishing...");
    try {
      const r = await fetch("/api/holiday-types", {method, headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: holiday.id, version: holiday.version})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "The request failed. Please try again.");
      if (method === "DELETE") {setRemoved(true); setMessage("Holiday Type deleted.");}
      else {setUnpublished(true); setMessage("Holiday Type unpublished and returned to drafts.");}
      router.refresh();
    } catch (e) {setFailed(true); setMessage(e instanceof Error ? e.message : "The request failed.");}
    finally {saving.current = false; setBusy(false);}
  }
  return <div className="article-admin-actions">
    {!removed && <a href={`/admin/holiday-types/${holiday.id}/edit`}>Edit</a>}
    {!removed && holiday.status === "published" && !unpublished && <button type="button" disabled={busy} onClick={() => void act("PATCH")}>Unpublish</button>}
    {!removed && !holiday.is_original && <button type="button" disabled={busy} onClick={() => void act("DELETE")}>Delete</button>}
    {holiday.is_original && <small>Original public URL protected. Unpublish to hide it.</small>}
    <div aria-live="polite">{message && <p role={failed ? "alert" : "status"}>{message}</p>}</div>
  </div>;
}
