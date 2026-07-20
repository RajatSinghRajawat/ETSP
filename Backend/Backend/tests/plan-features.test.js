import { normalizeFeatures } from '../src/services/entitlement.service.js';

describe('normalizeFeatures', () => {
  test('legacy employer plan maps maxJobPosts onto maxActiveJobs', () => {
    const features = normalizeFeatures({
      audience: 'employer',
      features: { aiEnabled: true, autoReplyEnabled: false, maxJobPosts: 5, maxApplications: null },
    });

    expect(features.maxActiveJobs).toBe(5);
    expect(features.aiEnabled).toBe(true);
  });

  test('legacy candidate plan maps autoReplyEnabled onto autoApplyEnabled', () => {
    const features = normalizeFeatures({
      audience: 'candidate',
      features: { autoReplyEnabled: true },
    });

    expect(features.autoApplyEnabled).toBe(true);
  });

  test('employer plans do NOT inherit auto-apply from autoReplyEnabled', () => {
    const features = normalizeFeatures({
      audience: 'employer',
      features: { autoReplyEnabled: true },
    });

    expect(features.autoApplyEnabled).toBe(false);
    expect(features.autoReplyEnabled).toBe(true);
  });

  test('missing keys fail closed', () => {
    const features = normalizeFeatures({ audience: 'employer', features: {} });

    expect(features.maxActiveJobs).toBe(0);
    expect(features.maxApplications).toBe(0);
    expect(features.chatEnabled).toBe(false);
    expect(features.searchFiltersEnabled).toBe(false);
    expect(features.screeningQuestionsEnabled).toBe(false);
    expect(features.unlockCreditsPerJob).toBe(0);
    expect(features.directMessageEmployersPerMonth).toBe(0);
    expect(features.resumeBuilderIncluded).toBe(false);
    expect(features.visibleExcelProfilesPerJob).toBe(0);
  });

  test('no plan at all fails closed', () => {
    const features = normalizeFeatures(null);

    expect(features.maxActiveJobs).toBe(0);
    expect(features.aiEnabled).toBe(false);
  });

  test('explicit nulls mean unlimited / not applicable', () => {
    const features = normalizeFeatures({
      audience: 'employer',
      features: {
        maxActiveJobs: null,
        jobValidityDays: null,
        visibleExcelProfilesPerJob: null,
        maxApplications: null,
      },
    });

    expect(features.maxActiveJobs).toBeNull();
    expect(features.jobValidityDays).toBeNull();
    expect(features.visibleExcelProfilesPerJob).toBeNull();
    expect(features.maxApplications).toBeNull();
  });

  test('modern full-feature doc passes through', () => {
    const features = normalizeFeatures({
      audience: 'employer',
      features: {
        maxActiveJobs: 3,
        jobValidityDays: 30,
        featuredJobs: 1,
        searchFiltersEnabled: true,
        chatEnabled: true,
        screeningQuestionsEnabled: true,
        unlockCreditsPerJob: 50,
        visibleExcelProfilesPerJob: null,
        dedicatedAccountManager: true,
        creditAddonsEnabled: true,
        aiEnabled: true,
      },
    });

    expect(features.maxActiveJobs).toBe(3);
    expect(features.jobValidityDays).toBe(30);
    expect(features.featuredJobs).toBe(1);
    expect(features.unlockCreditsPerJob).toBe(50);
    expect(features.visibleExcelProfilesPerJob).toBeNull();
    expect(features.dedicatedAccountManager).toBe(true);
  });
});
