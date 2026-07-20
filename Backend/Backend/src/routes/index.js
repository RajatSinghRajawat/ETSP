import { adminRoutes } from './admin.routes.js';
import { aiAssistantRoutes } from './ai-assistant.routes.js';
import { candidateProfileRoutes } from './candidate-profile.routes.js';
import { chatRoutes } from './chat.routes.js';
import { employerProfileRoutes } from './employer-profile.routes.js';
import { healthRoutes } from './health.routes.js';
import { jobApplicationRoutes } from './job-application.routes.js';
import { jobRoutes } from './job.routes.js';
import { savedJobRoutes } from './saved-job.routes.js';
import {
  educationRoutes,
  jobTypeRoutes,
  salaryUnitRoutes,
  skillRoutes,
} from './lookup.routes.js';
import authRoutes from './auth.routes.js';
import { planRoutes } from './plan.routes.js';
import { purchaseRoutes } from './purchase.routes.js';
import { subscriptionRoutes } from './subscription.routes.js';
import { webhookRoutes } from './webhook.routes.js';

export async function apiRoutes(app) {
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/auth' });
  app.register(candidateProfileRoutes, { prefix: '/candidate-profiles' });
  app.register(employerProfileRoutes, { prefix: '/employer-profiles' });
  app.register(jobRoutes, { prefix: '/jobs' });
  app.register(jobApplicationRoutes, { prefix: '/applications' });
  app.register(savedJobRoutes, { prefix: '/saved-jobs' });
  app.register(chatRoutes, { prefix: '/chat' });
  app.register(jobTypeRoutes, { prefix: '/job-types' });
  app.register(skillRoutes, { prefix: '/skills' });
  app.register(educationRoutes, { prefix: '/educations' });
  app.register(salaryUnitRoutes, { prefix: '/salary-units' });
  app.register(adminRoutes, { prefix: '/admin' });
  app.register(aiAssistantRoutes, { prefix: '/ai' });
  app.register(planRoutes, { prefix: '/plans' });
  app.register(subscriptionRoutes, { prefix: '/subscriptions' });
  app.register(purchaseRoutes, { prefix: '/purchases' });
  app.register(webhookRoutes, { prefix: '/webhooks' });
}
