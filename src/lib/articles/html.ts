import sanitize from "sanitize-html";
export function cleanHtml(html: string) {
  return sanitize(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "br",
      "table","thead","tbody","tfoot","tr","th","td","caption",
    ],
    allowedAttributes: { a: ["href", "title", "rel"], th:['colspan','rowspan','scope','style'],td:['colspan','rowspan','style'] },
    allowedStyles: {th:{'text-align':[/^(?:left|right|center|justify)$/]},td:{'text-align':[/^(?:left|right|center|justify)$/]}},
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      h1: "h2",
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
      th: safeCell,
      td: safeCell,
    },
  });
}
function safeCell(tagName:string,attribs:Record<string,string>){
  const safe={...attribs};
  for(const name of ['colspan','rowspan'])if(!/^[1-9][0-9]?$|^100$/.test(safe[name]||''))delete safe[name];
  if(!['col','row','colgroup','rowgroup'].includes(safe.scope))delete safe.scope;
  return {tagName,attribs:safe};
}
export function bodyText(html: string) {
  return sanitize(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
export function excerpt(html: string) {
  const text = bodyText(html
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    .replace(/<(?:br\b[^>]*|\/(?:p|li|blockquote))>/gi, " "));
  if (text.length <= 200) return text;
  const part = text.slice(0, 197);
  const sentences = [...part.matchAll(/[.!?](?=\s|$)/g)];
  const end = sentences.at(-1)?.index;
  if (end !== undefined && end >= 60) return part.slice(0, end + 1);
  const space = part.lastIndexOf(" ");
  return (space > 0 ? part.slice(0, space) : "") + "...";
}
