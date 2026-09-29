import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getEmailSettings, onSettingsChange } from './settings.service.js';

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

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
            Your full profile access is now active. Candidates can apply for jobs, and employers can post jobs.
          </p>
        </div>
      </div>
    `;
    const text = `Hi ${greetingName}, your ${roleLabel} registration on VetJobs has been approved. Your full profile access is now active.`;
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
            approve it at this time. You may still log in and manage your own profile, but it will remain hidden and restricted.
          </p>
          <p style="font-size: 16px; color: #555;">
            Your details are still on file. If you believe this was a mistake or you can share
            more information, please contact our support team and we will take another look.
          </p>
        </div>
      </div>
    `;
    const text = `Hi ${greetingName}, after reviewing your ${roleLabel} registration on VetJobs our team was not able to approve it at this time. You may still log in and manage your own profile, but it will remain hidden and restricted. Please contact support if you believe this was a mistake.`;
    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendHiredEmail(email, { candidateName = 'there', jobTitle = 'the role', companyName = 'the employer', employerMessage = '' } = {}) {
    const subject = `Congratulations! You have been hired for ${jobTitle}${companyName ? ` at ${companyName}` : ''} 🎉`;
    const messageBlock = employerMessage
      ? `
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <strong style="color: #065f46; display: block; margin-bottom: 6px; font-size: 14px;">Message from ${companyName || 'Employer'}:</strong>
          <p style="margin: 0; color: #166534; font-size: 15px; font-style: italic; white-space: pre-wrap;">"${employerMessage}"</p>
        </div>
      `
      : '';

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
          <div style="width: 58px; height: 58px; background: rgba(255,255,255,0.22); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; font-size: 28px;">
            🎉
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Congratulations, You're Hired!</h1>
          <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.95; color: #ffffff;">Great news regarding your job application</p>
        </div>
        <div style="padding: 28px; color: #334155; font-size: 15px; line-height: 1.65;">
          <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Hi ${candidateName},</p>
          <p style="margin-bottom: 18px;">
            We are thrilled to share that <strong>${companyName || 'The employer'}</strong> has reviewed your application and officially marked you as <strong>Hired</strong> for the role of <strong>${jobTitle}</strong>!
          </p>
          ${messageBlock}
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 24px 0;">
            <p style="margin: 0 0 6px; font-weight: 700; color: #0f172a; font-size: 14px;">What happens next?</p>
            <p style="margin: 0; color: #64748b; font-size: 13.5px; line-height: 1.5;">
              The employer will reach out with the offer letter, contract details, and next onboarding steps. You can also log into your VetJobs candidate portal to view your application status.
            </p>
          </div>
          <p style="margin-bottom: 6px; color: #475569;">Best of luck with your new role!</p>
          <p style="margin: 0; font-weight: 700; color: #0f172a;">The VetJobs Team</p>
        </div>
      </div>
    `;

    const text = `Hi ${candidateName},\n\nCongratulations! You have been hired for ${jobTitle}${companyName ? ` at ${companyName}` : ''}.\n\n${employerMessage ? `Message from employer: "${employerMessage}"\n\n` : ''}Log in to your VetJobs candidate portal to review your status.\n\nBest regards,\nThe VetJobs Team`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Tells the employer a candidate applied to their job. Carries no candidate
   * name or contact details: those may be masked for this employer's plan, so
   * the email links to the dashboard, which applies the masking rules.
   */
  async sendNewApplicationEmail(
    email,
    { jobTitle = 'your job', jobId, applicationId, count = 1, isAutoApplied = false } = {},
  ) {
    const title = escapeHtml(jobTitle);
    // Several applications at once (a new job's auto-apply sweep) link to the
    // job's applicant list instead of a single application.
    const link = count > 1
      ? `${env.FRONTEND_BASE_URL}/employer/jobs/${jobId}/applicants`
      : `${env.FRONTEND_BASE_URL}/employer/applications/${applicationId}`;
    const who = count > 1 ? `${count} candidates have` : 'A candidate has';
    const subject = count > 1 ? `${count} new applications for ${jobTitle}` : `New application for ${jobTitle}`;
    const via = isAutoApplied ? ' through auto-apply' : '';
    const html = this.#ticketLayout({
      heading: count > 1 ? 'New job applications' : 'New job application',
      bodyHtml: `
        <p>Hi,</p>
        <p>${who} applied${via} for your job <strong>${title}</strong> on VetJobs.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${link}" style="background:#0c5283;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;display:inline-block;">
            ${count > 1 ? 'View applicants' : 'View application'}
          </a>
        </p>
        <p style="font-size:13px;color:#888;">You can also find ${count > 1 ? 'them' : 'it'} under Applications in your employer dashboard.</p>
      `,
    });
    const text = `${who} applied${via} for your job "${jobTitle}" on VetJobs.\n\nView: ${link}`;
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
