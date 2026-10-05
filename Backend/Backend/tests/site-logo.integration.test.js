import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { brandingUploadDir } from '../src/config/upload.js';
import { getSiteContent, updateSiteContent } from '../src/services/settings.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';

jest.setTimeout(60_000);

const LOGO_ROUTE = '/api/v1/admin/settings/site-content/logo';

// Smallest valid PNG (1x1, transparent) — enough for a real upload round trip.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const adminToken = () => jwt.sign({ sub: 'admin-test', role: 'admin' }, env.JWT_SECRET);
const adminHeaders = () => ({ authorization: `Bearer ${adminToken()}` });

function multipart(fileName, mimeType, content) {
  const boundary = '----etsLogoTestBoundary';
  return {
    payload: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: ${mimeType}\r\n\r\n`,
      ),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

const filePathFor = (logoUrl) => path.join(brandingUploadDir, path.basename(logoUrl));

// Every logo a test uploads, so a failed assertion never leaves files behind.
const uploadedUrls = new Set();

async function uploadLogo(app, { fileName = 'logo.png', mimeType = 'image/png', content = PNG_BYTES } = {}) {
  const body = multipart(fileName, mimeType, content);
  const response = await app.inject({
    method: 'POST',
    url: LOGO_ROUTE,
    payload: body.payload,
    headers: { ...body.headers, ...adminHeaders() },
  });
  const logoUrl = response.statusCode === 200 ? response.json().data.branding.logoUrl : null;
  if (logoUrl) uploadedUrls.add(logoUrl);
  return { response, logoUrl };
}

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await Promise.all([...uploadedUrls].map((url) => unlink(filePathFor(url)).catch(() => {})));
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('website logo', () => {
  test('defaults to an empty logo so the site uses its bundled one', async () => {
    const content = await getSiteContent();
    expect(content.branding).toEqual({ logoUrl: '' });
  });

  test('upload is admin-only', async () => {
    const app = await buildApp();
    try {
      const body = multipart('logo.png', 'image/png', PNG_BYTES);

      const anonymous = await app.inject({
        method: 'POST',
        url: LOGO_ROUTE,
        payload: body.payload,
        headers: body.headers,
      });
      expect(anonymous.statusCode).toBe(401);

      const candidateToken = jwt.sign({ sub: 'user-1', role: 'candidate' }, env.JWT_SECRET);
      const candidate = await app.inject({
        method: 'POST',
        url: LOGO_ROUTE,
        payload: body.payload,
        headers: { ...body.headers, authorization: `Bearer ${candidateToken}` },
      });
      expect(candidate.statusCode).toBe(403);

      expect((await getSiteContent()).branding.logoUrl).toBe('');
    } finally {
      await app.close();
    }
  });

  test('an uploaded logo is stored, served and exposed to the public site', async () => {
    const app = await buildApp();
    try {
      const { response, logoUrl } = await uploadLogo(app);
      expect(response.statusCode).toBe(200);
      expect(logoUrl).toMatch(/\/uploads\/branding\/logo-.+\.png$/);
      expect(existsSync(filePathFor(logoUrl))).toBe(true);

      // No auth: the public website reads the logo from here.
      const publicContent = await app.inject({ method: 'GET', url: '/api/v1/site-content' });
      expect(publicContent.statusCode).toBe(200);
      expect(publicContent.json().data.branding.logoUrl).toBe(logoUrl);

      const served = await app.inject({
        method: 'GET',
        url: `/uploads/branding/${path.basename(logoUrl)}`,
      });
      expect(served.statusCode).toBe(200);
      expect(served.headers['content-type']).toBe('image/png');
      expect(served.rawPayload.equals(PNG_BYTES)).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('replacing the logo deletes the file it replaced', async () => {
    const app = await buildApp();
    try {
      const first = await uploadLogo(app);
      const second = await uploadLogo(app);

      expect(second.logoUrl).not.toBe(first.logoUrl);
      expect(existsSync(filePathFor(first.logoUrl))).toBe(false);
      expect(existsSync(filePathFor(second.logoUrl))).toBe(true);
      expect((await getSiteContent()).branding.logoUrl).toBe(second.logoUrl);
    } finally {
      await app.close();
    }
  });

  test('saving text content keeps the uploaded logo', async () => {
    const app = await buildApp();
    try {
      const { logoUrl } = await uploadLogo(app);

      await updateSiteContent({ social: { facebook: 'https://facebook.com/vetslinked' } });
      await updateSiteContent({ lang: 'hi', contact: { phone: '+91 99999 00000' } });

      const content = await getSiteContent();
      expect(content.branding.logoUrl).toBe(logoUrl);
      expect(content.social.facebook).toBe('https://facebook.com/vetslinked');
      expect(content.hi.contact.phone).toBe('+91 99999 00000');
    } finally {
      await app.close();
    }
  });

  test('a logo sent through the text endpoint is ignored', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/admin/settings/site-content',
        payload: {
          social: { facebook: 'https://facebook.com/vetslinked' },
          branding: { logoUrl: 'https://evil.example.com/logo.png' },
        },
        headers: adminHeaders(),
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().data.branding.logoUrl).toBe('');
    } finally {
      await app.close();
    }
  });

  test('rejects a file that is not a JPG, PNG or WEBP image', async () => {
    const app = await buildApp();
    try {
      const { response } = await uploadLogo(app, {
        fileName: 'logo.svg',
        mimeType: 'image/svg+xml',
        content: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      });
      expect(response.statusCode).toBe(400);
      expect((await getSiteContent()).branding.logoUrl).toBe('');
    } finally {
      await app.close();
    }
  });

  test('rejects a logo over 2MB and keeps the current one', async () => {
    const app = await buildApp();
    try {
      const { logoUrl } = await uploadLogo(app);

      const tooBig = await uploadLogo(app, { content: Buffer.alloc(2 * 1024 * 1024 + 1) });
      expect(tooBig.response.statusCode).toBe(400);

      expect((await getSiteContent()).branding.logoUrl).toBe(logoUrl);
      expect(existsSync(filePathFor(logoUrl))).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('removing the logo restores the default and deletes the file', async () => {
    const app = await buildApp();
    try {
      const { logoUrl } = await uploadLogo(app);

      const removed = await app.inject({
        method: 'DELETE',
        url: LOGO_ROUTE,
        headers: adminHeaders(),
      });
      expect(removed.statusCode).toBe(200);
      expect(removed.json().data.branding.logoUrl).toBe('');
      expect(existsSync(filePathFor(logoUrl))).toBe(false);

      // Removing again is a harmless no-op.
      const again = await app.inject({ method: 'DELETE', url: LOGO_ROUTE, headers: adminHeaders() });
      expect(again.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
