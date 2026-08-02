import {
  getStats,
  getAnalytics,
  postAssistant,
  getUsers,
  patchUser,
  removeUser,
  getCandidates,
  getCandidate,
  removeCandidate,
  approveCandidate,
  rejectCandidate,
  getEmployers,
  getEmployer,
  removeEmployer,
  approveEmployer,
  rejectEmployer,
  importEmployersExcel,
  getImportedEmployers,
  removeImportedEmployer,
  getJobs,
  getJob,
  patchJob,
  approveJob,
  rejectJob,
  removeJob,
  getApplications,
  patchApplication,
  removeApplication,
} from '../controllers/admin.controller.js';
import { buildResume, fetchResume, saveResume } from '../controllers/resume.controller.js';
import {
  getAdminPlans,
  patchPlan,
  postPlan,
  postPlanSync,
  removePlan,
} from '../controllers/plan.controller.js';
import {
  getEmailSettingsHandler,
  getMsg91SettingsHandler,
  getSiteContentHandler,
  getStripeSettingsHandler,
  putEmailSettingsHandler,
  putMsg91SettingsHandler,
  putSiteContentHandler,
  putStripeSettingsHandler,
  translateSiteContentHandler,
} from '../controllers/settings.controller.js';
import { getAdminPurchases } from '../controllers/purchase.controller.js';
import {
  getAdminSubscriptions,
  postGrantSubscription,
} from '../controllers/subscription.controller.js';
import {
  approveAdminLookupHandler,
  createAdminLookupHandler,
  deleteAdminLookupHandler,
  disableAdminLookupHandler,
  getAdminLookupHandler,
  listAdminLookupsHandler,
  listLookupCategoriesHandler,
  rejectAdminLookupHandler,
  updateAdminLookupHandler,
} from '../controllers/lookup-option.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateBody } from '../middlewares/validate.js';
import { createPlanSchema, updatePlanSchema } from '../validations/plan.validation.js';
import { grantSubscriptionSchema } from '../validations/subscription.validation.js';
import {
  emailSettingsSchema,
  msg91SettingsSchema,
  siteContentSchema,
  siteContentTranslateSchema,
  stripeSettingsSchema,
} from '../validations/settings.validation.js';
import {
  createAdminLookupSchema,
  rejectLookupSchema,
  updateAdminLookupSchema,
} from '../validations/lookup-option.validation.js';

export async function adminRoutes(app) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('admin'));

  app.get('/stats', getStats);
  app.get('/analytics', getAnalytics);
  app.post('/assistant', postAssistant);

  app.get('/users', getUsers);
  app.patch('/users/:id', patchUser);
  app.delete('/users/:id', removeUser);

  app.get('/candidates', getCandidates);
  app.get('/candidates/:id', getCandidate);
  app.delete('/candidates/:id', removeCandidate);
  app.patch('/candidates/:id/approve', approveCandidate);
  app.patch('/candidates/:id/reject', rejectCandidate);

  app.post('/candidates/:id/resume', buildResume);
  app.get('/candidates/:id/resume', fetchResume);
  app.put('/candidates/:id/resume', saveResume);

  app.get('/employers', getEmployers);
  app.get('/employers/:id', getEmployer);
  app.delete('/employers/:id', removeEmployer);
  app.patch('/employers/:id/approve', approveEmployer);
  app.patch('/employers/:id/reject', rejectEmployer);

  app.post('/imported-employers/upload', importEmployersExcel);
  app.get('/imported-employers', getImportedEmployers);
  app.delete('/imported-employers/:id', removeImportedEmployer);

  app.get('/jobs', getJobs);
  app.get('/jobs/:id', getJob);
  app.patch('/jobs/:id', patchJob);
  app.patch('/jobs/:id/approve', approveJob);
  app.patch('/jobs/:id/reject', rejectJob);
  app.delete('/jobs/:id', removeJob);

  app.get('/applications', getApplications);
  app.patch('/applications/:id', patchApplication);
  app.delete('/applications/:id', removeApplication);

  app.get('/plans', getAdminPlans);
  app.post('/plans', { preHandler: validateBody(createPlanSchema) }, postPlan);
  app.patch('/plans/:id', { preHandler: validateBody(updatePlanSchema) }, patchPlan);
  app.delete('/plans/:id', removePlan);
  app.post('/plans/:id/sync', postPlanSync);

  app.get('/subscriptions', getAdminSubscriptions);
  app.post('/subscriptions/grant', { preHandler: validateBody(grantSubscriptionSchema) }, postGrantSubscription);

  app.get('/purchases', getAdminPurchases);

  app.get('/lookups/categories', listLookupCategoriesHandler);
  app.get('/lookups', listAdminLookupsHandler);
  app.get('/lookups/:id', getAdminLookupHandler);
  app.post('/lookups', { preHandler: validateBody(createAdminLookupSchema) }, createAdminLookupHandler);
  app.patch('/lookups/:id', { preHandler: validateBody(updateAdminLookupSchema) }, updateAdminLookupHandler);
  app.delete('/lookups/:id', deleteAdminLookupHandler);
  app.patch('/lookups/:id/approve', approveAdminLookupHandler);
  app.patch('/lookups/:id/reject', { preHandler: validateBody(rejectLookupSchema) }, rejectAdminLookupHandler);
  app.patch('/lookups/:id/disable', disableAdminLookupHandler);

  app.get('/settings/stripe', getStripeSettingsHandler);
  app.put('/settings/stripe', { preHandler: validateBody(stripeSettingsSchema) }, putStripeSettingsHandler);
  app.get('/settings/email', getEmailSettingsHandler);
  app.put('/settings/email', { preHandler: validateBody(emailSettingsSchema) }, putEmailSettingsHandler);
  app.get('/settings/msg91', getMsg91SettingsHandler);
  app.put('/settings/msg91', { preHandler: validateBody(msg91SettingsSchema) }, putMsg91SettingsHandler);
  app.get('/settings/site-content', getSiteContentHandler);
  app.put('/settings/site-content', { preHandler: validateBody(siteContentSchema) }, putSiteContentHandler);
  app.post(
    '/settings/site-content/translate',
    { preHandler: validateBody(siteContentTranslateSchema) },
    translateSiteContentHandler,
  );
}
