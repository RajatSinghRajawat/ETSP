import { buildApp } from '../src/app.js';

describe('app', () => {
  test('returns health status through Fastify inject', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      message: 'API is healthy',
      data: {
        service: 'ets-backend',
        status: 'ok',
      },
    });
  });

  test('handles CORS preflight from frontend dev origin', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/candidate-profiles/image',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('handles CORS preflight from any local frontend port', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/candidate-profiles/image',
      headers: {
        origin: 'http://localhost:5178',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5178');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('requires auth before candidate profile submissions', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/candidate-profiles',
      payload: {
        email: 'invalid-profile@example.com',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Authentication token is required',
    });
  });

  test('validates employer profile submissions before persistence', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/employer-profiles',
      payload: {
        email: 'invalid-employer@example.com',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Validation failed',
    });
  });

  test('requires auth token before posting a job', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs',
      payload: {
        title: 'Veterinary Surgeon',
        type: 'Full-time',
        location: 'Jaipur',
        description: 'Handle clinical operations',
        skills: ['Surgery'],
        experience: '2-5',
        education: 'BVSc',
      },
    });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: 'Authentication token is required',
    });
  });

  test('uploads employer logo image', async () => {
    const app = await buildApp();
    const boundary = '----employer-logo-test';
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="logo"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/employer-profiles/logo',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      message: 'Employer logo uploaded successfully',
      data: {
        mimeType: 'image/png',
      },
    });
  });

  test('uploads candidate profile image', async () => {
    const app = await buildApp();
    const boundary = '----candidate-profile-image-test';
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="profile.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/candidate-profiles/image',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      message: 'Candidate profile image uploaded successfully',
      data: {
        mimeType: 'image/png',
      },
    });
  });

  test('adds CORS headers to actual image upload response', async () => {
    const app = await buildApp();
    const boundary = '----candidate-profile-image-cors-test';
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="profile.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/candidate-profiles/image',
      headers: {
        origin: 'http://localhost:5173',
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
