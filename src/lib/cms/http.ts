import 'server-only';
import { CmsError, verifyOrigin } from './security';
import { cmsConfig } from './config';
import { adminClient } from './client';
export async function writeClient(request: Request) {
  const config = cmsConfig();
  if (!config) throw new CmsError('The content portal has not been configured.', 503);
  verifyOrigin(request, config.origin);
  return adminClient();
}
export async function readJson(request: Request, maximum = 350000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new CmsError('Expected a JSON request.', 415);
  // Stream limit also covers chunked requests without Content-Length.
  const reader = request.body?.getReader(); if (!reader) throw new CmsError('No content was supplied.');
  const chunks: Uint8Array[] = []; let size=0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length;
    if (size > maximum) { await reader.cancel(); throw new CmsError('The article is too long.',413); } chunks.push(part.value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new CmsError('The supplied content could not be read.'); }
}
export function failure(error: unknown) {
  return Response.json({error: error instanceof CmsError ? error.message : 'Something went wrong. Please try again.'},
    {status: error instanceof CmsError ? error.status : 500, headers: {'Cache-Control': 'private, no-store'}});
}
