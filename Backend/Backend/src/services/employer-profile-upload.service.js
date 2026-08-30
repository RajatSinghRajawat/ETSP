import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import {
  allowedImageMimeTypes,
  maxImageBytes,
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

  // The shared multipart ceiling is larger (resumes need it), so images
  // are held to their own 2MB limit here.
  if (file.file.truncated || (file.file.bytesRead ?? 0) > maxImageBytes) {
    await unlink(uploadPath).catch(() => {});
    throw new AppError('Image must be 2MB or smaller', 400);
  }

  return {
    fileName,
    mimeType: file.mimetype,
    url: `${env.PUBLIC_BASE_URL}/uploads/employer-profiles/${fileName}`,
  };
}
