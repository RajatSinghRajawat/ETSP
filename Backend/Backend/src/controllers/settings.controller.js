import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import {
  getEmailSettings,
  getEmailSettingsMasked,
  getMsg91SettingsMasked,
  getStripeSettingsMasked,
  updateEmailSettings,
  updateMsg91Settings,
  updateStripeSettings,
} from '../services/settings.service.js';
import { AppError } from '../utils/app-error.js';

export async function getStripeSettingsHandler() {
  const data = await getStripeSettingsMasked();

  return {
    success: true,
    message: 'Stripe settings fetched successfully',
    data,
  };
}

export async function putStripeSettingsHandler(request) {
  const { secretKey } = request.body;

  // Validate a new secret key against Stripe before persisting it, so the
  // admin gets immediate feedback on a bad/revoked key.
  if (secretKey) {
    try {
      await new Stripe(secretKey).accounts.retrieve();
    } catch {
      throw new AppError('Stripe rejected this secret key. Please check it and try again.', 400);
    }
  }

  const data = await updateStripeSettings(request.body);

  return {
    success: true,
    message: 'Stripe settings updated successfully',
    data,
  };
}

export async function getEmailSettingsHandler() {
  const data = await getEmailSettingsMasked();

  return {
    success: true,
    message: 'Email settings fetched successfully',
    data,
  };
}

export async function putEmailSettingsHandler(request) {
  const data = await updateEmailSettings(request.body);

  // Verify the merged SMTP credentials so the admin gets immediate feedback —
  // but only when connection details were part of this update.
  const touchedConnection = ['host', 'port', 'user', 'pass'].some(
    (field) => request.body[field] !== undefined,
  );

  if (touchedConnection && data.enabled) {
    const settings = await getEmailSettings();
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      auth: { user: settings.user, pass: settings.pass },
    });

    try {
      await transporter.verify();
    } catch {
      return {
        success: true,
        message: 'Settings saved, but the SMTP connection test failed — please double-check host, port, user and password.',
        data,
      };
    }
  }

  return {
    success: true,
    message: 'Email settings updated successfully',
    data,
  };
}

export async function getMsg91SettingsHandler() {
  const data = await getMsg91SettingsMasked();

  return {
    success: true,
    message: 'MSG91 settings fetched successfully',
    data,
  };
}

export async function putMsg91SettingsHandler(request) {
  const data = await updateMsg91Settings(request.body);

  if (data.enabled && !data.configured) {
    return {
      success: true,
      message: 'Settings saved — add the MSG91 auth key and template ID to start sending SMS.',
      data,
    };
  }

  return {
    success: true,
    message: 'MSG91 settings updated successfully',
    data,
  };
}
