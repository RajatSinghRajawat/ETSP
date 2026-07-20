import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import {
  allowedImageMimeTypes,
  employerProfileUploadDir,
} from '../config/upload.js';
import { AppError } from '../utils/app-error.js';

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function uploadEmployerLogo(file) {
  if (!file) {
    throw new AppError('Company logo is required', 400);
  }

  if (!allowedImageMimeTypes.has(file.mimetype)) {
    throw new AppError('Only JPG, PNG, and WEBP images are allowed', 400);
  }

  await mkdir(employerProfileUploadDir, { recursive: true });

  const fileExtension = extensionByMimeType[file.mimetype];
  const fileName = `${Date.now()}-${randomUUID()}${fileExtension}`;
  const uploadPath = path.join(employerProfileUploadDir, fileName);

  await pipeline(file.file, createWriteStream(uploadPath));

  return {
    fileName,
    mimeType: file.mimetype,
    url: `${env.PUBLIC_BASE_URL}/uploads/employer-profiles/${fileName}`,
  };
}
