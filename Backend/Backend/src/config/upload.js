import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, '../..');

export const uploadRoot = path.resolve(projectRoot, env.UPLOAD_DIR);
export const candidateProfileUploadDir = path.join(uploadRoot, 'candidate-profiles');
export const employerProfileUploadDir = path.join(uploadRoot, 'employer-profiles');
export const bannerUploadDir = path.join(uploadRoot, 'banners');
export const candidateResumeUploadDir = path.join(uploadRoot, 'candidate-resumes');

// Multipart ceiling for every upload route; each service then enforces its own,
// tighter limit so raising this for resumes does not loosen image uploads.
export const uploadLimits = {
  fileSize: 5 * 1024 * 1024,
};

export const maxImageBytes = 2 * 1024 * 1024;
export const maxResumeBytes = 5 * 1024 * 1024;

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const allowedResumeMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
