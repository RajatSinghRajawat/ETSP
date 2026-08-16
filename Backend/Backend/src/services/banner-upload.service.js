import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import { allowedImageMimeTypes, bannerUploadDir } from '../config/upload.js';
import { AppError } from '../utils/app-error.js';

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const PUBLIC_PREFIX = '/uploads/banners/';

export async function uploadBannerImage(file) {
  if (!file) {
    throw new AppError('Banner image is required', 400);
  }

  if (!allowedImageMimeTypes.has(file.mimetype)) {
    throw new AppError('Only JPG, PNG, and WEBP images are allowed', 400);
  }

  await mkdir(bannerUploadDir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}${extensionByMimeType[file.mimetype]}`;
  const uploadPath = path.join(bannerUploadDir, fileName);

  try {
    await pipeline(file.file, createWriteStream(uploadPath));
  } catch (error) {
    // A rejected pipeline still leaves the partial file behind — drop it so the
    // banner directory never collects stubs that no record points at.
    await unlink(uploadPath).catch(() => {});
    if (error?.code === 'FST_REQ_FILE_TOO_LARGE' || file.file.truncated) {
      throw new AppError('Banner image is too large — keep it under 2MB', 400);
    }
    throw error;
  }

  return {
    fileName,
    mimeType: file.mimetype,
    url: `${env.PUBLIC_BASE_URL}${PUBLIC_PREFIX}${fileName}`,
  };
}

/**
 * Best-effort removal of a previously uploaded banner file. Only paths this
 * service produced are touched, so a URL pointing anywhere else is left alone.
 */
export async function deleteBannerImage(imageUrl) {
  if (typeof imageUrl !== 'string') return;

  const marker = imageUrl.indexOf(PUBLIC_PREFIX);
  if (marker === -1) return;

  const fileName = path.basename(imageUrl.slice(marker + PUBLIC_PREFIX.length));
  if (!fileName || fileName === '.' || fileName === '..') return;

  await unlink(path.join(bannerUploadDir, fileName)).catch(() => {});
}
