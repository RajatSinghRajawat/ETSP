/**
 * The `?redirect=` contract between the route guard, the 401 handler and the
 * login screen: where to send a visitor back to once they have signed in.
 */

/** Build the login URL that remembers where the visitor was headed. */
export const buildLoginPath = (returnTo: string) =>
  `/login?redirect=${encodeURIComponent(returnTo)}`;

/**
 * Only internal, single-slash paths are accepted as a return target, so a
 * crafted `?redirect=//evil.com` cannot turn the login screen into an open
 * redirect. Bouncing back to /login itself would loop, so that is rejected too.
 */
export const safeRedirectPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/login')) return null;
  return value;
};
