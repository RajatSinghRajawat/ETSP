import React, { useEffect, useRef } from 'react';
import { UNAUTHORIZED_EVENT } from '../../store/api/axiosInstance';
import notify from '../../utils/toast';
import { buildLoginPath } from '../../utils/loginRedirect';

/**
 * Sends the visitor to the login screen the moment any API call comes back
 * 401 — an expired or revoked token, or a request made without one.
 *
 * The interceptor has already cleared the stored session by the time this
 * fires; this navigates to the login screen with the return path.
 */
const SessionExpiredRedirect: React.FC = () => {
  // A page usually fires several queries at once, so a single expiry arrives
  // as a burst of 401s. Only the first one should navigate and toast.
  const handledAt = useRef(0);

  useEffect(() => {
    const onUnauthorized = () => {
      const pathname = window.location.pathname;
      const search = window.location.search;

      if (pathname.startsWith('/login')) return;

      const now = Date.now();
      if (now - handledAt.current < 3000) return;
      handledAt.current = now;

      notify.info('Your session has ended. Please sign in again.');
      window.location.replace(buildLoginPath(`${pathname}${search}`));
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  return null;
};

export default SessionExpiredRedirect;
