import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import {
  sendOtpSchema,
  switchProfileSchema,
  verifyOtpSchema,
} from '../validations/auth.validation.js';

export default async function authRoutes(fastify) {
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
