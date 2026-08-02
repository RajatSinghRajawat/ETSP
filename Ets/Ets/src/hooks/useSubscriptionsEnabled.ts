import { useGetBillingStatusQuery } from '../store/api/siteContentApi';

/**
 * Public billing kill-switch from GET /billing-status.
 * Defaults to ON while loading so we don't flash free-mode UI incorrectly.
 */
export function useSubscriptionsEnabled() {
  const { data, isLoading, isError } = useGetBillingStatusQuery(undefined, {
    refetchOnMountOrArgChange: 60,
  });

  return {
    subscriptionsEnabled: data?.data?.subscriptionsEnabled !== false,
    isLoading,
    isError,
  };
}
