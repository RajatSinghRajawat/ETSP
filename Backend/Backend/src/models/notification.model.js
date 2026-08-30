import mongoose from 'mongoose';

/**
 * An in-app notification for a single user (candidate or employer).
 *
 * Written by the flows that change something the other side cares about —
 * an application arriving, an employer opening it, a status move, an interview
 * being scheduled. Read through the header bell; `link` is the in-app route the
 * bell navigates to when the row is clicked.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    recipientRole: {
      type: String,
      enum: ['candidate', 'employer', 'admin'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'application_submitted',
        'application_viewed',
        'application_reviewing',
        'application_shortlisted',
        'application_rejected',
        'application_hired',
        'interview_scheduled',
        'general',
      ],
      default: 'general',
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, trim: true, default: '', maxlength: 1000 },
    // In-app route opened when the notification row is clicked.
    link: { type: String, trim: true, default: '' },
    readAt: { type: Date, default: null },
    // Loose display context (job title, company/candidate name, interview date…).
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ recipientEmail: 1, createdAt: -1 });
notificationSchema.index({ recipientEmail: 1, readAt: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
