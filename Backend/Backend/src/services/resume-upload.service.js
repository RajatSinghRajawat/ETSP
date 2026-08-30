import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { env } from '../config/env.js';
import {
  allowedResumeMimeTypes,
  candidateResumeUploadDir,
  maxResumeBytes,
} from '../config/upload.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

const extensionByMimeType = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const PUBLIC_PREFIX = '/uploads/candidate-resumes/';

/** Store a candidate-supplied resume file and return its metadata. */
export async function uploadCandidateResumeFile(file) {
  if (!file) {
    throw new AppError('Resume file is required', 400);
  }

  if (!allowedResumeMimeTypes.has(file.mimetype)) {
    throw new AppError('Only PDF, DOC and DOCX resumes are allowed', 400);
  }

  await mkdir(candidateResumeUploadDir, { recursive: true });

  const fileExtension = extensionByMimeType[file.mimetype];
  const fileName = `${Date.now()}-${randomUUID()}${fileExtension}`;
  const uploadPath = path.join(candidateResumeUploadDir, fileName);

  await pipeline(file.file, createWriteStream(uploadPath));

  // `truncated` is set when the multipart ceiling cut the stream short; the
  // byte count catches anything over this route's own, tighter limit.
  const size = file.file.bytesRead ?? 0;

  if (file.file.truncated || size > maxResumeBytes) {
    await removeResumeFile(fileName);
    throw new AppError('Resume must be 5MB or smaller', 400);
  }

  return {
    url: `${env.PUBLIC_BASE_URL}${PUBLIC_PREFIX}${fileName}`,
    fileName,
    originalName: file.filename ?? '',
    mimeType: file.mimetype,
    size,
    uploadedAt: new Date(),
  };
}

/** Best-effort delete of a stored resume file; never throws. */
export async function removeResumeFile(fileName) {
  if (!fileName) return;

  try {
    await unlink(path.join(candidateResumeUploadDir, fileName));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logger.warn('Could not delete resume file', { message: error.message, fileName });
    }
  }
}
