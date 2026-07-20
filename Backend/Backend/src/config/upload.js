import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, '../..');

export const uploadRoot = path.resolve(projectRoot, env.UPLOAD_DIR);
export const candidateProfileUploadDir = path.join(uploadRoot, 'candidate-profiles');
export const employerProfileUploadDir = path.join(uploadRoot, 'employer-profiles');

export const uploadLimits = {
  fileSize: 2 * 1024 * 1024,
};

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
