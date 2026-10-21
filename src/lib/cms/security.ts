export class CmsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function databaseError(error: {code?: string} | null) {
  if (!error) return;
  if (error.code === '23505') throw new CmsError('That URL slug or category is already in use. Choose another.');
  if (error.code === '40001') throw new CmsError('This article changed in another tab. Copy your changes, then reload.', 409);
  if (error.code === '23503') throw new CmsError('An image or category is in use or is no longer available.', 409);
  if (error.code === '42501') throw new CmsError('You do not have permission for this operation.', 403);
  throw new CmsError('The changes could not be saved. Your text is still in the editor. Please try again.', 503);
}
export async function verifyAdministrator(client: {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
}) {
  const {data, error} = await client.auth.getUser();
  if (error || !data.user) throw new CmsError('Please sign in to continue.', 401);
  const membership = await client.rpc('cms_is_admin');
  if (membership.error) throw new CmsError('Administrator permissions could not be checked. Please try again.', 503);
  if (membership.data !== true) throw new CmsError('This account is not authorised to manage content.', 403);
  return data.user;
}
export function verifyOrigin(request: Request, origin: string) {
  if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new CmsError('This request could not be verified. Reopen the portal and try again.', 403);
  }
}
