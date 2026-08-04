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

  async sendApprovalEmail(email, { firstName = '', role = 'candidate' } = {}) {
    const greetingName = firstName ? firstName : 'there';
    const roleLabel = role === 'employer' ? 'employer' : 'candidate';
    const subject = 'Your VetJobs registration has been approved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #333;">Registration Approved</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 16px; color: #555;">Hi ${greetingName},</p>
          <p style="font-size: 16px; color: #555;">
            Good news — your ${roleLabel} registration on VetJobs has been reviewed and approved by our team.
          </p>
          <p style="font-size: 16px; color: #555;">
            You can now log in using your registered email and OTP.
          </p>
        </div>
      </div>
    `;
    const text = `Hi ${greetingName}, your ${roleLabel} registration on VetJobs has been approved. You can now log in using your registered email and OTP.`;
    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendRejectionEmail(email, { firstName = '', role = 'candidate' } = {}) {
    const greetingName = firstName ? firstName : 'there';
    const roleLabel = role === 'employer' ? 'employer' : 'candidate';
    const subject = 'Update on your VetJobs registration';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #333;">Registration Not Approved</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 16px; color: #555;">Hi ${greetingName},</p>
          <p style="font-size: 16px; color: #555;">
            After reviewing your ${roleLabel} registration on VetJobs, our team was not able to
            approve it at this time, so you will not be able to log in for now.
          </p>
          <p style="font-size: 16px; color: #555;">
            Your details are still on file. If you believe this was a mistake or you can share
            more information, please contact our support team and we will take another look.
          </p>
        </div>
      </div>
    `;
    const text = `Hi ${greetingName}, after reviewing your ${roleLabel} registration on VetJobs our team was not able to approve it at this time, so you will not be able to log in for now. Your details are still on file — please contact support if you believe this was a mistake.`;
    return this.sendEmail({ to: email, subject, html, text });
  }

  /** Shared chrome for the support-ticket emails below. */
  #ticketLayout({ heading, bodyHtml }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%); padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff;">${heading}</h2>
        </div>
        <div style="padding: 24px; color: #555; font-size: 15px; line-height: 1.6;">
          ${bodyHtml}
        </div>
      </div>
    `;
  }

  /** Confirmation to the user right after they raise a ticket. */
  async sendTicketCreatedEmail(email, { reference, subject: ticketSubject, name = '' } = {}) {
    const greetingName = name || 'there';
    const subject = `We received your support request (${reference})`;
    const html = this.#ticketLayout({
      heading: 'Support request received',
      bodyHtml: `
        <p>Hi ${greetingName},</p>
        <p>Thanks for reaching out. Your support ticket has been logged and our team will look into it shortly.</p>
        <p style="background:#f4f8fc;border-radius:6px;padding:12px;">
          <strong>Reference:</strong> ${reference}<br/>
          <strong>Subject:</strong> ${ticketSubject}
        </p>
        <p>You can follow the conversation from the Support section of your dashboard. We will email you as soon as there is an update.</p>
      `,
    });
    const text = `Hi ${greetingName}, we received your support ticket ${reference} ("${ticketSubject}"). Our team will get back to you shortly.`;
    return this.sendEmail({ to: email, subject, html, text });
  }

  /** Heads-up to the support inbox when a new ticket lands. */
  async sendTicketAdminAlertEmail(adminEmail, { reference, subject: ticketSubject, fromName, fromEmail, category, priority, body } = {}) {
    const subject = `[New ticket ${reference}] ${ticketSubject}`;
    const html = this.#ticketLayout({
      heading: 'New support ticket',
      bodyHtml: `
        <p style="background:#f4f8fc;border-radius:6px;padding:12px;">
          <strong>Reference:</strong> ${reference}<br/>
          <strong>From:</strong> ${fromName || fromEmail} &lt;${fromEmail}&gt;<br/>
          <strong>Category:</strong> ${category} &nbsp;|&nbsp; <strong>Priority:</strong> ${priority}
        </p>
        <p><strong>${ticketSubject}</strong></p>
        <p style="white-space:pre-wrap;">${String(body ?? '').slice(0, 2000)}</p>
        <p>Open the Support Tickets page in the admin panel to reply.</p>
      `,
    });
    const text = `New ticket ${reference} from ${fromEmail}: ${ticketSubject}\n\n${String(body ?? '').slice(0, 2000)}`;
    return this.sendEmail({ to: adminEmail, subject, html, text });
  }

  /** Sent to the user when an admin replies and/or changes the status. */
  async sendTicketReplyEmail(email, { reference, subject: ticketSubject, name = '', replyBody = '', status } = {}) {
    const greetingName = name || 'there';
    const subject = `Update on your support request (${reference})`;
    const statusLabels = {
      open: 'Open',
      in_progress: 'In progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    const statusLine = status
      ? `<p><strong>Status:</strong> ${statusLabels[status] ?? status}</p>`
      : '';
    const replyBlock = replyBody
      ? `<p style="background:#f4f8fc;border-radius:6px;padding:12px;white-space:pre-wrap;">${replyBody}</p>`
      : '';
    const html = this.#ticketLayout({
      heading: 'Support ticket update',
      bodyHtml: `
        <p>Hi ${greetingName},</p>
        <p>There is an update on your ticket <strong>${reference}</strong> — "${ticketSubject}".</p>
        ${replyBlock}
        ${statusLine}
        <p>You can reply from the Support section of your dashboard.</p>
      `,
    });
    const text = `Hi ${greetingName}, there is an update on your ticket ${reference} ("${ticketSubject}").\n\n${replyBody}\n\n${status ? `Status: ${statusLabels[status] ?? status}` : ''}`;
    return this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
