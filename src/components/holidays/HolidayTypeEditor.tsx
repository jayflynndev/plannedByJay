"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { VisualEditor } from "@/components/articles/VisualEditor";
import { ImageSelector } from "@/components/articles/ImageSelector";
import { HolidayTypePage, type HolidayDisplay } from "./HolidayPages";
import { emptyHoliday, holidayInput, holidaySlug, type HolidayInput, type HolidayType } from "@/lib/holiday-types/schema";

export function HolidayTypeEditor({initial, initialImageUrl = "", publicBaseUrl}: {initial?: HolidayType; initialImageUrl?: string; publicBaseUrl: string}) {
  const [value, setValue] = useState<HolidayInput>(() => initial ? holidayInput.parse(Object.fromEntries(Object.keys(emptyHoliday()).map(k => [k, initial[k as keyof HolidayInput]]))) : emptyHoliday());
  const [baseline, setBaseline] = useState(() => JSON.stringify(value));
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [link, setLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [photos, setPhotos] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initialImageUrl);
  const [preview, setPreview] = useState<HolidayDisplay | null>(null);
  const saving = useRef(false), slugEdited = useRef(!!initial?.slug), headingEdited = useRef(!!initial?.heading);
  const dirty = JSON.stringify(value) !== baseline;
  const locked = !!saved?.published_at || !!saved?.is_original;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof HolidayInput>(key: K, next: HolidayInput[K]) {
    setValue(v => ({...v, [key]: next,
      ...(key === "name" && !headingEdited.current ? {heading: String(next)} : {}),
      ...(key === "name" && !locked && !slugEdited.current ? {slug: holidaySlug(String(next))} : {}),
    }));
    setMessage(""); setLink(""); setCopyMessage("");
  }
  async function save(status: HolidayInput["status"], isPreview = false) {
    if (saving.current) return;
    if (!isPreview && status === "draft" && saved?.status === "published" && !window.confirm("Unpublish this Holiday Type and return it to drafts? It will no longer appear publicly.")) return;
    saving.current = true;
    setBusy(isPreview ? "Preparing preview..." : status === "published" ? "Saving publication..." : "Saving draft...");
    setMessage(""); setLink(""); setCopyMessage(""); setFailed(false);
    try {
      const r = await fetch(isPreview ? "/api/holiday-types/preview" : "/api/holiday-types", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({...value, status}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "The save failed. Your unsaved work is retained.");
      if (isPreview) {
        setPreview({...data.holiday, photoUrl: photoUrl || null});
        setMessage("Private preview ready. Nothing was saved or published.");
      } else {
        const next = holidayInput.parse(Object.fromEntries(Object.keys(emptyHoliday()).map(k => [k, data.holiday[k]])));
        setValue(next); setSaved(data.holiday); setBaseline(JSON.stringify(next)); slugEdited.current = true;
        window.history.replaceState(null, "", `/admin/holiday-types/${next.id}/edit`);
        setMessage(status === "published" ? saved?.status === "published" ? "Holiday Type changes saved successfully." : "Holiday Type published successfully." : saved?.status === "published" ? "Holiday Type unpublished and returned to drafts." : "Draft saved successfully.");
        if (status === "published") setLink(new URL(`/holidays/${next.slug}`, publicBaseUrl).href);
      }
    } catch (e) { setFailed(true); setMessage(e instanceof Error ? e.message : "The request failed. Your unsaved work is retained."); }
    finally { saving.current = false; setBusy(""); }
  }
  return <>
    <div className="article-admin-heading"><h1>{value.id ? "Edit Holiday Type" : "New Holiday Type"}</h1><a href="/admin/holiday-types">All Holiday Types</a></div>
    <p>{dirty ? "Unsaved changes" : saved ? "Saved" : "Not saved yet"}{saved ? ` - ${saved.status === "published" ? "Published" : "Draft"} - Updated ${new Date(saved.updated_at).toLocaleDateString("en-GB", {timeZone: "Europe/London"})}` : ""}</p>
    <fieldset disabled={!!busy} className="article-admin-form">
      <label>Name<input value={value.name} maxLength={120} onChange={e => change("name", e.target.value)}/></label>
      <label>Short introduction<textarea rows={3} maxLength={500} value={value.introduction} onChange={e => change("introduction", e.target.value)}/></label>
      <p>Used on the Holiday Type card, its page and automatic SEO/social descriptions.</p>
      <label>Main heading<input value={value.heading} maxLength={180} onChange={e => {headingEdited.current = true; change("heading", e.target.value);}}/></label>
      <details><summary>Page URL</summary><label>URL slug<input value={value.slug} maxLength={60} readOnly={locked} onChange={e => {slugEdited.current = true; change("slug", e.target.value);}}/></label><p>{locked ? "This public URL is permanent, including after unpublishing." : "A short URL is suggested from the name. You can change it before first publication."}</p></details>
      <div><h2>Page content</h2><VisualEditor value={value.body} onChange={body => change("body", body)} disabled={!!busy} label="Page content"/></div>
      <section><h2>Photograph</h2>
        {value.image && photoUrl && <Image src={photoUrl} alt={value.image_alt} width={320} height={220}/>}
        <div className="article-admin-actions"><button type="button" onClick={() => setPhotos(true)}>Choose or upload photograph</button>{value.image && <button type="button" onClick={() => {change("image", ""); change("image_alt", ""); setPhotoUrl("");}}>Remove photograph</button>}</div>
        {photos && <ImageSelector onClose={() => setPhotos(false)} onSelect={image => {change("image", image.path); change("image_alt", image.alt || value.name); change("image_position", "50% 50%"); setPhotoUrl(image.url); setPhotos(false);}}/>}
        {value.image && <label>Image description<input value={value.image_alt} maxLength={300} onChange={e => change("image_alt", e.target.value)}/></label>}
      </section>
      <details><summary>Closing invitation</summary><label>Closing heading<input value={value.closing_heading} maxLength={180} onChange={e => change("closing_heading", e.target.value)}/></label><label>Closing text<textarea rows={3} value={value.closing_body} maxLength={1000} onChange={e => change("closing_body", e.target.value)}/></label><p>The Plan My Holiday button continues to use the existing Holiday Brief route.</p></details>
      <div className="article-admin-actions">
        {value.status === "draft" && <button type="button" className="button button-secondary" onClick={() => void save("draft")}>Save Draft</button>}
        <button type="button" className="button button-secondary" onClick={() => void save(value.status, true)}>Preview</button>
        <button type="button" className="button" onClick={() => void save("published")}>{value.status === "published" ? "Save Changes" : "Publish"}</button>
        {value.status === "published" && <button type="button" className="button button-secondary" onClick={() => void save("draft")}>Unpublish</button>}
      </div>
      <div className="article-save-feedback" aria-live={failed ? "assertive" : "polite"} aria-atomic="true">
        {(busy || message) && <p role={failed ? "alert" : "status"} className={failed ? "article-admin-error" : "article-admin-notice"}>{busy || message}</p>}
        {link && !busy && <div className="article-admin-actions"><a href={link}>View Holiday Type</a><button type="button" onClick={async () => {try {await navigator.clipboard.writeText(link); setCopyMessage("Link copied.");} catch {setCopyMessage("Copy this link: " + link);}}}>Copy Link</button>{copyMessage && <span>{copyMessage}</span>}</div>}
      </div>
      <p>Save regularly; there is no background autosave. Preview is private and does not save. Unpublishing removes this type from public pages.</p>
    </fieldset>
    {preview && <section className="article-private-preview" aria-label="Private Holiday Type preview"><button type="button" className="button button-secondary" onClick={() => setPreview(null)}>Close preview</button><p>Private preview - nothing was published by this action.</p><HolidayTypePage holiday={preview} preview/></section>}
  </>;
}
