// upload.middleware.ts — Multer configuration for product image uploads
// Uses memory storage to stream files directly to Cloudinary without writing to disk
// Max file size: 5MB — accepted formats: jpeg, jpg, png, webp

import multer from 'multer'
import { BadRequestError } from '../utils/AppError.js'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequestError('Format de fichier invalide — jpeg, png ou webp uniquement'))
      return
    }
    cb(null, true)
  },
})