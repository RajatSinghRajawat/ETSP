import { mkdir } from 'node:fs/promises';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';
import { uploadLimits, uploadRoot } from '../config/upload.js';

async function uploadPluginCore(app) {
  await mkdir(uploadRoot, { recursive: true });

  await app.register(fastifyMultipart, {
    limits: uploadLimits,
  });

  await app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });
}

export const uploadPlugin = fp(uploadPluginCore, {
  name: 'upload-plugin',
});
