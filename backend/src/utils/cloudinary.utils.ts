// cloudinary.utils.ts — Cloudinary upload and deletion helpers
// Used by product controller to manage product images

import { fileTypeFromBuffer } from 'file-type'
import cloudinary from '../lib/cloudinary.js'
import { BadRequestError } from './AppError.js'

export const CLOUDINARY_FOLDER = 'apilace/products'
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Verifies the magic number of a buffer to prevent mimetype spoofing
// This is a second check after multer's mimetype filter
export async function verifyImageBuffer(buffer: Buffer): Promise<void> {
  const type = await fileTypeFromBuffer(buffer)
  if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
    throw new BadRequestError('Format de fichier invalide — jpeg, png ou webp uniquement')
  }
}

// Uploads a buffer to Cloudinary and returns the secure URL
// Files are automatically converted to webp for consistency and performance
export async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: 'image', format: 'webp' },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result.secure_url)
      }
    ).end(buffer)
  })
}

// Extracts the Cloudinary public_id from a secure URL for deletion
export function getCloudinaryPublicId(url: string): string {
  return url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '')
}

// Deletes an image from Cloudinary by its URL
export async function deleteFromCloudinary(url: string): Promise<void> {
  await cloudinary.uploader.destroy(getCloudinaryPublicId(url))
}