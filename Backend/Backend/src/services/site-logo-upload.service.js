import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import { allowedImageMimeTypes, brandingUploadDir, maxImageBytes } from '../config/upload.js';
import { AppError } from '../utils/app-error.js';

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const PUBLIC_PREFIX = '/uploads/branding/';

export async function uploadSiteLogo(file) {
  if (!file) {
    throw new AppError('Logo image is required', 400);
  }

  if (!allowedImageMimeTypes.has(file.mimetype)) {
    throw new AppError('Only JPG, PNG, and WEBP images are allowed', 400);
  }

  await mkdir(brandingUploadDir, { recursive: true });

  const fileName = `logo-${Date.now()}-${randomUUID()}${extensionByMimeType[file.mimetype]}`;
  const uploadPath = path.join(brandingUploadDir, fileName);

  try {
    await pipeline(file.file, createWriteStream(uploadPath));
  } catch (error) {
    // A rejected pipeline still leaves the partial file behind — drop it so the
    // branding directory never collects stubs that no setting points at.
    await unlink(uploadPath).catch(() => {});
    if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new AppError('Logo must be 2MB or smaller', 400);
    }
    throw error;
  }

  // The shared multipart ceiling is larger (resumes need it), so images
  // are held to their own 2MB limit here.
  if (file.file.truncated || (file.file.bytesRead ?? 0) > maxImageBytes) {
    await unlink(uploadPath).catch(() => {});
    throw new AppError('Logo must be 2MB or smaller', 400);
  }

  return {
    fileName,
    mimeType: file.mimetype,
    url: `${env.PUBLIC_BASE_URL}${PUBLIC_PREFIX}${fileName}`,
  };
}

/**
 * Best-effort removal of a previously uploaded logo file. Only paths this
 * service produced are touched, so a URL pointing anywhere else is left alone.
 */
export async function deleteSiteLogo(logoUrl) {
  if (typeof logoUrl !== 'string') return;

  const marker = logoUrl.indexOf(PUBLIC_PREFIX);
  if (marker === -1) return;

  const fileName = path.basename(logoUrl.slice(marker + PUBLIC_PREFIX.length));
  if (!fileName || fileName === '.' || fileName === '..') return;

  await unlink(path.join(brandingUploadDir, fileName)).catch(() => {});
}
