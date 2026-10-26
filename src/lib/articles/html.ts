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
    ],
    allowedAttributes: { a: ["href", "title", "rel"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      h1: "h2",
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
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
