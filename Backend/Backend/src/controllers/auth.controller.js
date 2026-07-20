import { authService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

class AuthController {
  async sendOtp(request, reply) {
    try {
      const { email } = request.body;
      const response = await authService.sendOtp(email);
      reply.send({ success: true, ...response });
    } catch (err) {
      logger.error('Error sending OTP', err);
      reply.status(err.statusCode || 500).send({
        success: false,
        message: err.message || 'Internal server error'
      });
    }
  }

  async verifyOtp(request, reply) {
    try {
      const { email, otp } = request.body;
      const response = await authService.verifyOtp(email, otp);
      reply.send({ success: true, ...response });
    } catch (err) {
      logger.error('Error verifying OTP', err);
      reply.status(err.statusCode || 500).send({
        success: false,
        message: err.message || 'Internal server error'
      });
    }
  }

  async switchProfile(request, reply) {
    try {
      const { role } = request.body;
      const response = await authService.switchProfile(request.headers.authorization, role);
      reply.send({ success: true, ...response });
    } catch (err) {
      logger.error('Error switching profile', err);
      reply.status(err.statusCode || 500).send({
        success: false,
        message: err.message || 'Internal server error'
      });
    }
  }
}

export const authController = new AuthController();
