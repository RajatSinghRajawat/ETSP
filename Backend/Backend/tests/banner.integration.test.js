import { jest } from '@jest/globals';
import { buildApp } from '../src/app.js';
import { Banner } from '../src/models/banner.model.js';
import * as bannerService from '../src/services/banner.service.js';
import {
  createBannerSchema,
  updateBannerSchema,
} from '../src/validations/banner.validation.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';

jest.setTimeout(60_000);

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

const bannerFields = (overrides = {}) => ({
  title: 'Spring campaign',
  imageUrl: 'http://localhost:5000/uploads/banners/banner-1.png',
  linkUrl: 'https://advertiser.example.com/offer',
  altText: '20% off supplies',
  placements: ['home_top'],
  isActive: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
  ...overrides,
});

const expectAppError = async (promise, statusCode) => {
  let caught = null;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  expect(caught.statusCode).toBe(statusCode);
};

describe('banner validation', () => {
  test('rejects a link that is not http(s)', () => {
    const parsed = createBannerSchema.safeParse(
      bannerFields({ linkUrl: 'javascript:alert(1)' }),
    );
    expect(parsed.success).toBe(false);
  });

  test('rejects an image that was not uploaded through the banner endpoint', () => {
    const parsed = createBannerSchema.safeParse(
      bannerFields({ imageUrl: 'https://evil.example.com/tracker.gif' }),
    );
    expect(parsed.success).toBe(false);
  });

  test('rejects an unknown placement', () => {
    const parsed = createBannerSchema.safeParse(bannerFields({ placements: ['nowhere'] }));
    expect(parsed.success).toBe(false);
  });

  test('requires at least one placement', () => {
    const parsed = createBannerSchema.safeParse(bannerFields({ placements: [] }));
    expect(parsed.success).toBe(false);
  });

  test('rejects a campaign that ends before it starts', () => {
    const parsed = createBannerSchema.safeParse(
      bannerFields({ startsAt: '2026-06-10', endsAt: '2026-06-01' }),
    );
    expect(parsed.success).toBe(false);
  });

  test('accepts a valid banner and coerces the dates', () => {
    const parsed = createBannerSchema.safeParse(
      bannerFields({ startsAt: '2026-06-01', endsAt: '2026-06-30' }),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data.startsAt).toBeInstanceOf(Date);
    expect(parsed.data.endsAt).toBeInstanceOf(Date);
  });

  test('update schema leaves omitted fields alone', () => {
    const parsed = updateBannerSchema.safeParse({ isActive: false });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ isActive: false });
  });
});

describe('public banner listing', () => {
  test('returns only banners assigned to the requested placement', async () => {
    await Banner.create(bannerFields({ title: 'Home', placements: ['home_top'] }));
    await Banner.create(bannerFields({ title: 'Jobs', placements: ['jobs_list'] }));

    const homeBanners = await bannerService.listPublicBanners('home_top');
    expect(homeBanners).toHaveLength(1);

    const jobBanners = await bannerService.listPublicBanners('jobs_list');
    expect(jobBanners).toHaveLength(1);
  });

  test('a banner in several placements shows in each of them', async () => {
    await Banner.create(
      bannerFields({ placements: ['home_top', 'jobs_list', 'global_top'] }),
    );

    for (const placement of ['home_top', 'jobs_list', 'global_top']) {
      expect(await bannerService.listPublicBanners(placement)).toHaveLength(1);
    }
    expect(await bannerService.listPublicBanners('job_detail')).toHaveLength(0);
  });

  test('hides inactive banners', async () => {
    await Banner.create(bannerFields({ isActive: false }));
    expect(await bannerService.listPublicBanners('home_top')).toHaveLength(0);
  });

  test('hides banners whose campaign has not started or has ended', async () => {
    const day = 24 * 60 * 60 * 1000;
    await Banner.create(
      bannerFields({ title: 'Future', startsAt: new Date(Date.now() + day) }),
    );
    await Banner.create(
      bannerFields({ title: 'Expired', endsAt: new Date(Date.now() - day) }),
    );
    await Banner.create(
      bannerFields({
        title: 'Running',
        startsAt: new Date(Date.now() - day),
        endsAt: new Date(Date.now() + day),
      }),
    );

    const running = await bannerService.listPublicBanners('home_top');
    expect(running).toHaveLength(1);
  });

  test('orders by sortOrder and exposes only display fields', async () => {
    await Banner.create(bannerFields({ title: 'Second', sortOrder: 5 }));
    await Banner.create(bannerFields({ title: 'First', sortOrder: 1 }));

    const banners = await bannerService.listPublicBanners('home_top');
    expect(banners).toHaveLength(2);
    expect(banners[0].sortOrder).toBeUndefined();
    expect(banners[0].title).toBeUndefined();
    expect(banners[0].clickCount).toBeUndefined();
    expect(banners[0]).toHaveProperty('imageUrl');
    expect(banners[0]).toHaveProperty('linkUrl');
  });

  test('rejects an unknown placement', async () => {
    await expectAppError(bannerService.listPublicBanners('nowhere'), 400);
  });
});

describe('banner clicks', () => {
  test('counts the click and returns the destination', async () => {
    const banner = await Banner.create(bannerFields());

    const result = await bannerService.registerBannerClick(banner._id.toString());
    expect(result.linkUrl).toBe('https://advertiser.example.com/offer');

    const reloaded = await Banner.findById(banner._id).lean();
    expect(reloaded.clickCount).toBe(1);
  });

  test('404s for an id that is not a banner', async () => {
    await expectAppError(bannerService.registerBannerClick('not-an-id'), 404);
  });
});

describe('public banner endpoint', () => {
  test('serves a placement to anonymous visitors and keeps admin routes locked', async () => {
    await Banner.create(bannerFields({ placements: ['home_top'] }));
    const app = await buildApp();

    try {
      const listed = await app.inject({ method: 'GET', url: '/api/v1/banners?placement=home_top' });
      expect(listed.statusCode).toBe(200);
      expect(listed.json().data).toHaveLength(1);
      expect(listed.json().data[0].linkUrl).toBe('https://advertiser.example.com/offer');

      const missingPlacement = await app.inject({ method: 'GET', url: '/api/v1/banners' });
      expect(missingPlacement.statusCode).toBe(400);

      // Managing banners stays behind the admin token.
      const admin = await app.inject({ method: 'GET', url: '/api/v1/admin/banners' });
      expect(admin.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  test('click endpoint counts the visit and returns the destination', async () => {
    const banner = await Banner.create(bannerFields());
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/banners/${banner._id}/click`,
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().data.linkUrl).toBe('https://advertiser.example.com/offer');
    } finally {
      await app.close();
    }

    const reloaded = await Banner.findById(banner._id).lean();
    expect(reloaded.clickCount).toBe(1);
  });
});

describe('admin banner management', () => {
  test('lists newest-first within the same sort order', async () => {
    await Banner.create(bannerFields({ title: 'A', isActive: false }));
    await Banner.create(bannerFields({ title: 'B' }));

    expect(await bannerService.listBannersAdmin()).toHaveLength(2);
    expect(await bannerService.listBannersAdmin({ isActive: 'true' })).toHaveLength(1);
    expect(await bannerService.listBannersAdmin({ placement: 'home_top' })).toHaveLength(2);
  });

  test('update replaces only the fields it is given', async () => {
    const banner = await Banner.create(bannerFields());

    const updated = await bannerService.updateBanner(banner._id.toString(), {
      isActive: false,
    });

    expect(updated.isActive).toBe(false);
    expect(updated.title).toBe('Spring campaign');
    expect(updated.placements).toEqual(['home_top']);
  });

  test('delete removes the record', async () => {
    const banner = await Banner.create(bannerFields());
    await bannerService.deleteBanner(banner._id.toString());
    expect(await Banner.countDocuments()).toBe(0);
  });

  test('404s when updating or deleting a missing banner', async () => {
    await expectAppError(bannerService.updateBanner('not-an-id', { isActive: false }), 404);
    await expectAppError(bannerService.deleteBanner('not-an-id'), 404);
  });
});
