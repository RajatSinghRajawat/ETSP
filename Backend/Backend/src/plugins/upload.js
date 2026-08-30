import { mkdir } from 'node:fs/promises';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';
import { frameAncestors } from '../config/cors.js';
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
    // Helmet sets `X-Frame-Options: SAMEORIGIN` app-wide, which stops the web
    // app (a different origin in dev, and a different host in production) from
    // previewing an uploaded PDF in an iframe. Uploads are inert files, so the
    // header is swapped for a `frame-ancestors` policy that still names only
    // this app's own origins.
    setHeaders(response) {
      response.removeHeader('X-Frame-Options');
      response.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);
    },
  });
}

export const uploadPlugin = fp(uploadPluginCore, {
  name: 'upload-plugin',
});
