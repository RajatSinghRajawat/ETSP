import {
  getVerificationStatus,
  postEmailOtp,
  postEmailOtpConfirm,
  postPhoneOtp,
  postPhoneOtpConfirm,
} from '../controllers/registration-verification.controller.js';
import { validateBody } from '../middlewares/validate.js';
import {
  confirmEmailOtpSchema,
  confirmPhoneOtpSchema,
  sendEmailOtpSchema,
  sendPhoneOtpSchema,
} from '../validations/registration-verification.validation.js';

// Public by design: these run before an account exists.
export async function registrationVerificationRoutes(app) {
  app.get('/status', getVerificationStatus);

  app.post('/email/send', {
    preHandler: validateBody(sendEmailOtpSchema),
  }, postEmailOtp);

  app.post('/email/confirm', {
    preHandler: validateBody(confirmEmailOtpSchema),
  }, postEmailOtpConfirm);

  app.post('/phone/send', {
    preHandler: validateBody(sendPhoneOtpSchema),
  }, postPhoneOtp);

  app.post('/phone/confirm', {
    preHandler: validateBody(confirmPhoneOtpSchema),
  }, postPhoneOtpConfirm);
}
