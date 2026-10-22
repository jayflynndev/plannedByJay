'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor, generateJSON } from '@tiptap/react';
import { MediaLibrary } from './MediaLibrary';
import type { Media } from '@/lib/cms/schema';
import { imageUrl } from '@/lib/cms/urls';
import { maximumArticleLength, readVisualMarkdown, richTextExtensions, safeEditorLink, sanitiseRichPaste, writeVisualMarkdown } from '@/lib/cms/rich-text';
type Guard={blocked:boolean;dirty:boolean};
type Props={body:string;onChange:(body:string)=>void;disabled:boolean;mediaBase:string;media:Media[];onUploaded:(media:Media)=>void;onGuard:(guard:Guard)=>void;error?:string};
export function VisualArticleEditor({body,onChange,disabled,mediaBase,media,onUploaded,onGuard,error}:Props) {
  const [mode,setMode]=useState<'visual'|'source'>('visual');const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState('');const [issue,setIssue]=useState('');const [blocked,setBlocked]=useState(false);
  const [panel,setPanel]=useState<'link'|'image'|'markdown'|null>(null);
  const [link,setLink]=useState('');const [photo,setPhoto]=useState('');const [alt,setAlt]=useState('');const [imported,setImported]=useState('');
  const [pendingText,setPendingText]=useState<string|null>(null);const [conversion,setConversion]=useState<string|null>(null);
  const original=useRef({source:body,normalised:''});
  const extensions=useMemo(()=>richTextExtensions(mediaBase),[mediaBase]);
  function load(instance:Editor,source:string) {
    try {
      const result=readVisualMarkdown(source,instance.markdown!,mediaBase);
      if(!result.document){setMode('source');setIssue(result.issue||'Use source mode for this content.');return false;}
      instance.commands.setContent(result.document,{emitUpdate:false});
      original.current={source,normalised:instance.getMarkdown()};
      setIssue('');setBlocked(false);setMode('visual');onGuard({blocked:false,dirty:false});return true;
    } catch {setMode('source');setIssue('This source could not be opened visually. It is retained in full below.');return false;}
  }
  const editor=useEditor({extensions,content:'',immediatelyRender:false,shouldRerenderOnTransaction:true,
    onCreate:({editor})=>{load(editor,body);setReady(true);},
    onUpdate:({editor})=>{
      try {
        const result=writeVisualMarkdown(editor.getJSON(),editor.markdown!,mediaBase);
        if(result.issue){setIssue(result.issue);setBlocked(true);onGuard({blocked:true,dirty:true});return;}
        setBlocked(false);setIssue('');onGuard({blocked:false,dirty:false});
        onChange(result.markdown===original.current.normalised?original.current.source:result.markdown!);
      } catch {setIssue('This change could not be converted safely. Undo it or review the Markdown conversion.');setBlocked(true);onGuard({blocked:true,dirty:true});}
    },
    editorProps:{attributes:{role:'textbox','aria-label':'Article body (visual editor)','aria-multiline':'true',id:'cms-body'},
      handleDrop:()=>{setNotice('Insert photographs using the Photograph button and media library.');return true;},
      handlePaste:(view,event)=>{
        const html=event.clipboardData?.getData('text/html')||'';const text=event.clipboardData?.getData('text/plain')||'';
        if(html.length>1000000||text.length>maximumArticleLength){setNotice('This paste is too large. Paste a shorter section.');return true;}
        if(!html&&!text){setNotice('Use the Photograph button for clipboard images.');return true;}
        try {
          if(html){
            const clean=sanitiseRichPaste(html,mediaBase);const json=generateJSON(clean.html,extensions);
            const result=writeVisualMarkdown(json,editor!.markdown!,mediaBase);
            if(result.issue){setPendingText(text||clean.text);setNotice(`${result.issue} You can keep the words as plain text or cancel this paste.`);onGuard({blocked:true,dirty:true});return true;}
            editor!.commands.insertContent(json);setNotice(clean.warnings.length?clean.warnings.join(' '):'Formatted content pasted. Review it in Preview article.');
          } else {
            // JSON text nodes deliberately bypass both HTML parsing and Markdown guessing.
            const paragraphs=text.replace(/\r\n?/g,'\n').split('\n').map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]}));
            editor!.commands.insertContent(paragraphs);setNotice('Plain text pasted. Use Paste Markdown when you want Markdown formatting converted.');
          }
        } catch {setPendingText(text);setNotice('This paste could not be converted reliably. Keep its words as plain text or cancel.');onGuard({blocked:true,dirty:true});}
        return true;
      }},
  });
  useEffect(()=>{editor?.setEditable(!disabled&&mode==='visual'&&pendingText===null,false);},[editor,disabled,mode,pendingText]);
  const locked=disabled||!editor||!ready||mode!=='visual'||pendingText!==null;
  const level=editor?.getAttributes('heading').level as number|undefined;
  function action(label:string,run:(editor:Editor)=>void,active?:boolean,unavailable=false) {
    return <button type="button" className="rich-tool" aria-label={label} title={label} aria-pressed={active} disabled={locked||unavailable} onMouseDown={event=>event.preventDefault()} onClick={()=>{if(editor)run(editor);}}>{label}</button>;
  }
  function clearPending(){setPendingText(null);onGuard({blocked,dirty:blocked});setNotice('');}
  return <section className="cms-rich-editor" aria-label="Article body editor">
    <div className="cms-actions"><button type="button" className="button button-secondary" aria-pressed={mode==='visual'} disabled={disabled||!ready||blocked||pendingText!==null} onClick={()=>editor&&load(editor,body)}>Visual editor</button>
      <button type="button" className="button button-secondary" aria-pressed={mode==='source'} disabled={disabled||!ready||blocked||pendingText!==null} onClick={()=>{setMode('source');setPanel(null);}}>Markdown source</button>
      <button type="button" className="cms-text-button" disabled={disabled||blocked||pendingText!==null} onClick={()=>setPanel(panel==='markdown'?null:'markdown')}>Paste Markdown</button></div>
    {issue&&<p role="alert" className="cms-error">{issue}</p>}
    {notice&&<p role="status" className="cms-notice">{notice}</p>}
    {blocked&&<><p>Your last safe Markdown is preserved. Saving is disabled until this visual change is resolved.</p><button type="button" className="cms-text-button" onClick={()=>setConversion(editor?.getMarkdown()||'')}>Review Markdown conversion</button></>}
    {conversion!==null&&<div className="cms-card"><label>Review converted Markdown<textarea value={conversion} onChange={event=>setConversion(event.target.value)} rows={10} maxLength={maximumArticleLength}/></label>
      <p>Check every affected section before accepting. This may simplify unsupported formatting.</p><button type="button" className="button button-secondary" onClick={()=>{if(window.confirm('Use this reviewed Markdown and replace the current visual content?')){onChange(conversion);setMode('source');setBlocked(false);setIssue('');setConversion(null);onGuard({blocked:false,dirty:false});}}}>Use reviewed Markdown</button><button type="button" className="cms-text-button" onClick={()=>setConversion(null)}>Cancel conversion review</button></div>}
    {pendingText!==null&&<div className="cms-card"><p>This paste is waiting for your choice; the article has not been replaced.</p><button type="button" className="button button-secondary" onClick={()=>{
      const text=pendingText;clearPending();editor?.commands.insertContent(text.split(/\r?\n/).map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]})));
    }}>Paste words as plain text</button><button type="button" className="cms-text-button" onClick={clearPending}>Cancel paste</button></div>}
    {panel==='markdown'&&<div className="cms-card"><label htmlFor="cms-markdown-import">Paste prepared Markdown</label><textarea id="cms-markdown-import" value={imported} onChange={event=>setImported(event.target.value)} rows={10} maxLength={maximumArticleLength} disabled={disabled}/><p>Import replaces the article body. The title and other article settings stay separate.</p>
      <button type="button" className="button button-secondary" disabled={disabled||!ready||!imported.trim()} onClick={()=>{
        if(body.trim()&&!window.confirm('Replace the current article body with the imported Markdown?'))return;
        onChange(imported);if(editor)load(editor,imported);setPanel(null);setImported('');setNotice('Markdown imported. Check Preview article before publishing.');
      }}>Replace body with Markdown</button></div>}
    {mode==='visual'?<>
      <div role="toolbar" aria-label="Article formatting" className="rich-toolbar" onKeyDown={event=>{
        if(!(event.target instanceof HTMLButtonElement)||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        const controls=[...event.currentTarget.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button:not(:disabled),select:not(:disabled)')];const index=controls.indexOf(event.target);
        controls[event.key==='Home'?0:event.key==='End'?controls.length-1:(index+(event.key==='ArrowLeft'?-1:1)+controls.length)%controls.length]?.focus();event.preventDefault();
      }}>
        <label className="rich-style-label">Text style<select aria-label="Text style" disabled={locked} value={editor?.isActive('heading')?String(level):'paragraph'} onChange={event=>{if(event.target.value==='paragraph')editor?.chain().focus().setParagraph().run();else editor?.chain().focus().setHeading({level:Number(event.target.value) as 2|3}).run();}}>
          <option value="paragraph">Normal paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option>{level&&![2,3].includes(level)&&<option value={String(level)} disabled>Existing heading (H{level})</option>}</select></label>
        {action('Bold',e=>e.chain().focus().toggleBold().run(),editor?.isActive('bold'))}{action('Italic',e=>e.chain().focus().toggleItalic().run(),editor?.isActive('italic'))}
        {action('Link',e=>{setLink(e.getAttributes('link').href||'');setPanel(panel==='link'?null:'link');},editor?.isActive('link'))}
        {action('Bulleted list',e=>e.chain().focus().toggleBulletList().run(),editor?.isActive('bulletList'))}{action('Numbered list',e=>e.chain().focus().toggleOrderedList().run(),editor?.isActive('orderedList'))}
        {action('Quotation',e=>e.chain().focus().toggleBlockquote().run(),editor?.isActive('blockquote'))}
        {action('Undo',e=>e.chain().focus().undo().run(),undefined,!editor?.can().undo())}{action('Redo',e=>e.chain().focus().redo().run(),undefined,!editor?.can().redo())}
        {action('Photograph',e=>{const attrs=e.getAttributes('image');setPhoto(attrs.src||'');setAlt(attrs.alt||'');setPanel(panel==='image'?null:'image');},undefined,editor?.isActive('table'))}
        {action('Insert table',e=>e.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run(),undefined,editor?.isActive('table'))}
        {editor?.isActive('table')&&<>
          {action('Add row',e=>e.chain().focus().addRowAfter().run())}{action('Remove row',e=>e.chain().focus().deleteRow().run())}
          {action('Add column',e=>e.chain().focus().addColumnAfter().run())}{action('Remove column',e=>e.chain().focus().deleteColumn().run())}
          {action('Delete table',e=>e.chain().focus().deleteTable().run())}
        </>}
      </div>
      {!ready&&<p role="status">Loading visual editor…</p>}
      <EditorContent editor={editor} className="rich-content"/>
      <p className="cms-hint">Ctrl/⌘+B: bold · Ctrl/⌘+I: italic · Ctrl/⌘+Z: undo. Paste formatted text normally; use Paste Markdown for raw Markdown. Tables use one paragraph per cell, without merged cells.</p>
    </>:<><label htmlFor="cms-body-source">Article body (Markdown)</label><textarea id="cms-body-source" value={body} onChange={event=>{onChange(event.target.value);setIssue('');}} maxLength={maximumArticleLength} rows={20} disabled={disabled} aria-invalid={Boolean(error)}/><p className="cms-hint">Complete original source is preserved in this advanced mode. Switch to Visual editor to check compatibility.</p></>}
    {panel==='link'&&mode==='visual'&&<div className="cms-card"><label htmlFor="cms-link">Link address</label><input id="cms-link" type="url" value={link} onChange={event=>setLink(event.target.value)} disabled={disabled}/><p>Use HTTPS, HTTP, mailto:, tel: or an internal /path. Select words in the article first, or the address is inserted as link text.</p>
      <button type="button" className="button button-secondary" disabled={disabled||!safeEditorLink(link)} onClick={()=>{
        if(!editor)return;
        if(editor.isActive('link')||!editor.state.selection.empty)editor.chain().focus().extendMarkRange('link').setLink({href:link}).run();
        else editor.chain().focus().insertContent({type:'text',text:link,marks:[{type:'link',attrs:{href:link}}]}).run();setPanel(null);
      }}>Apply link</button><button type="button" className="cms-text-button" onClick={()=>{editor?.chain().focus().extendMarkRange('link').unsetLink().run();setPanel(null);}}>Remove link</button></div>}
    {panel==='image'&&mode==='visual'&&<div className="cms-card"><MediaLibrary initialMedia={media} mediaBase={mediaBase} onUploaded={onUploaded} onSelect={item=>{setPhoto(imageUrl(mediaBase,item.storage_path));setAlt('');}}/>
      <label htmlFor="cms-inline-alt">Photograph description</label><input id="cms-inline-alt" value={alt} onChange={event=>setAlt(event.target.value)} maxLength={300} disabled={disabled}/><p>{photo?'A library photograph is selected. Add a description before inserting.':'Choose a library photograph above.'}</p>
      <button type="button" className="button button-secondary" disabled={disabled||!photo||!alt.trim()} onClick={()=>{editor?.chain().focus().setImage({src:photo,alt:alt.trim()}).run();setPanel(null);}}>Insert photograph</button></div>}
    {error&&<p className="cms-field-error" id="cms-error-body">{error}</p>}
  </section>;
}
