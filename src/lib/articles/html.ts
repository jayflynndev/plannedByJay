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
  const text = bodyText(html.replace(/<\/(?:p|h[23]|li|blockquote)>/g, "$& "));
  if (text.length <= 155) return text;
  const part = text.slice(0, 152);
  return part.slice(0, Math.max(part.lastIndexOf(" "), 110)) + "...";
}
