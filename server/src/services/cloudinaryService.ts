import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** True only when all three Cloudinary credentials are present. */
const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

// The individual truthiness check narrows each value from `string | undefined`
// to `string`, satisfying cloudinary.config under exactOptionalPropertyTypes.
if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

export interface StoredImage {
  /** The persistent, servable URL (Cloudinary CDN when configured). */
  url: string;
  /** Cloudinary public_id, needed for deletion. Null when not uploaded. */
  publicId: string | null;
}

/**
 * Persist a generated image.
 *  - With Cloudinary configured: uploads the source URL to the CDN and
 *    returns the permanent secure_url + public_id.
 *  - Without it: returns the original URL unchanged so history still works.
 */
export async function storeImage(sourceUrl: string): Promise<StoredImage> {
  if (!isConfigured) {
    return { url: sourceUrl, publicId: null };
  }
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder: 'eloura',
    resource_type: 'image',
  });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Remove an image from Cloudinary. No-op when not configured or no id. */
export async function destroyImage(publicId: string | null): Promise<void> {
  if (!isConfigured || !publicId) {
    return;
  }
  await cloudinary.uploader.destroy(publicId);
}
