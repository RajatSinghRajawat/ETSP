import type { EditableJobStatus, JobStatus } from '../../store/api/jobApi';

/** The dot colour and label shown next to a job's status everywhere. */
export const JOB_STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#64748b' },
  active: { label: 'Open', color: '#10b981' },
  paused: { label: 'Paused', color: '#d97706' },
  closed: { label: 'Closed', color: '#dc2626' },
  expired: { label: 'Expired', color: '#94a3b8' },
};

/**
 * Statuses the employer can pick in the dropdown. 'expired' is left out on
 * purpose — only the validity sweep sets it, and reopening an expired job goes
 * through 'active', which re-runs the plan's entitlement gate.
 */
export const SELECTABLE_JOB_STATUSES: EditableJobStatus[] = ['active', 'paused', 'closed', 'draft'];

export const formatJobDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** "2 months ago" — the relative line Indeed-style job lists lead with. */
export const formatRelativeDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

/** How the job was posted, shown in the plan / sponsorship column. */
export const POSTED_VIA_LABEL: Record<string, string> = {
  free: 'Free',
  pay_per_job: 'Pay Per Job',
  premium: 'Premium',
};
