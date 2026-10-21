import 'server-only';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { CmsError } from './security';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export async function prepareImage(bytes: Buffer, declaredType: string) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new CmsError('Choose an image smaller than 5 MB.');
  const detected = bytes.subarray(0,3).equals(Buffer.from([255,216,255])) ? 'image/jpeg'
    : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
    : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'image/webp' : null;
  if (!detected || detected !== declaredType) throw new CmsError('Choose a genuine JPEG, PNG or WebP photograph.');
  try {
    const image = sharp(bytes, {limitInputPixels: 40000000, animated: false, failOn: 'warning'});
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new Error('invalid image');
    // Re-encoding strips EXIF/GPS, ICC and all other input metadata; rotate respects phone orientation.
    const {data, info} = await image.rotate().resize({width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true}).webp({quality: 85}).toBuffer({resolveWithObject: true});
    if (data.length > MAX_IMAGE_BYTES) throw new Error('image too large');
    return {data, width: info.width, height: info.height, sha256: createHash('sha256').update(data).digest('hex')};
  } catch { throw new CmsError('This image could not be read. Export it as JPEG, PNG or WebP and try again.'); }
}
export function safeFilename(name: string) { return name.replace(/[\x00-\x1f\/\\]/g, '').slice(0,180) || 'Photograph'; }
