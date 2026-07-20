import { useGetMySubscriptionQuery } from '../store/api/subscriptionApi';

/**
 * Frontend view of the user's AI entitlement, driven by /subscriptions/me.
 * Purely a UX gate — the backend independently enforces every AI endpoint.
 */
export function useAiEntitlement() {
  const isLoggedIn = Boolean(localStorage.getItem('ets-access-token'));
  const { data, isLoading } = useGetMySubscriptionQuery(undefined, {
    skip: !isLoggedIn,
    refetchOnMountOrArgChange: 60,
  });

  const plan = data?.data.plan ?? null;

  return {
    isLoggedIn,
    isChecking: isLoggedIn && isLoading,
    aiAllowed: isLoggedIn && plan?.features.aiEnabled === true,
    planName: plan?.name ?? null,
  };
}

/** Open the global upgrade dialog (UpgradeDialog listens for this event). */
export function openUpgradePrompt(message?: string) {
  window.dispatchEvent(
    new CustomEvent('ets:plan-gate', {
      detail: {
        code: 'FEATURE_NOT_IN_PLAN',
        message: message ?? 'AI features are not included in your current plan. Upgrade to unlock them.',
      },
    }),
  );
}
