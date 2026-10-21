const mediaPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
export function imageUrl(base: string, path: string) {
  return `${base}/storage/v1/object/public/editorial-images/${path}`;
}
export function safeImageUrl(url: string, base: string) {
  const prefix = `${base}/storage/v1/object/public/editorial-images/`;
  return Boolean(base && url.startsWith(prefix) && mediaPattern.test(url.slice(prefix.length)));
}
export function articlePaths(slugs: string[]) {
  return ['/travel-advice', '/sitemap.xml', ...new Set(slugs.map(slug => `/travel-advice/${slug}`))];
}
