import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { getEmailSettings, onSettingsChange } from './settings.service.js';

/**
 * SMTP mailer driven by admin-managed settings (with .env fallback). The
 * transporter is built lazily and rebuilt whenever the admin saves new email
 * settings or toggles the service.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.fingerprint = null;
    onSettingsChange('email', () => this.reset());
  }

  reset() {
    this.transporter = null;
    this.fingerprint = null;
  }

  async isEnabled() {
    const settings = await getEmailSettings();
    return settings.enabled && Boolean(settings.host && settings.user);
  }

  async getTransporter() {
    const settings = await getEmailSettings();

    if (!settings.enabled) {
      return null;
    }

    const fingerprint = [settings.host, settings.port, settings.user, settings.pass].join('|');

    if (!this.transporter || this.fingerprint !== fingerprint) {
      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.port === 465, // true for 465, false for other ports
        auth: {
          user: settings.user,
          pass: settings.pass,
        },
      });
      this.fingerprint = fingerprint;
    }

    return this.transporter;
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const [transporter, settings] = await Promise.all([
        this.getTransporter(),
        getEmailSettings(),
      ]);

      if (!transporter) {
        logger.warn('Email service is disabled — skipping send', { to, subject });
        return false;
      }

      const info = await transporter.sendMail({
        from: settings.from,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email', error);
      return false;
    }
  }

  async sendOtpEmail(email, otp) {
    const subject = 'Your Login Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #333;">Login OTP</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Your verification code for logging into VetJobs is:</p>
          <div style="font-size: 32px; font-weight: bold; background: #e3f2fd; color: #1565c0; padding: 15px; border-radius: 8px; margin: 20px auto; display: inline-block; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes. Do not share this OTP with anyone.</p>
        </div>
      </div>
    `;
    const text = `Your VetJobs Login OTP is: ${otp}`;
    return this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
