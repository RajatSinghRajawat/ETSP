import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import {
  sendOtpSchema,
  switchProfileSchema,
  verifyOtpSchema,
} from '../validations/auth.validation.js';

export default async function authRoutes(fastify) {
  // Which OTP delivery options (email / SMS / WhatsApp) the login page may show.
  fastify.get('/otp-channels', authController.getOtpChannels);

  fastify.post('/send-otp', {
    preHandler: validateBody(sendOtpSchema.shape.body),
  }, authController.sendOtp);

  fastify.post('/verify-otp', {
    preHandler: validateBody(verifyOtpSchema.shape.body),
  }, authController.verifyOtp);

  fastify.post('/switch-profile', {
    preHandler: validateBody(switchProfileSchema.shape.body),
  }, authController.switchProfile);
}
