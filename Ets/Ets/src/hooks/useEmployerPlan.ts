import { useGetMyUsageQuery } from '../store/api/subscriptionApi';
import { useAuth } from './useAuth';
import { useSubscriptionsEnabled } from './useSubscriptionsEnabled';

/**
 * Whether the signed-in employer is on a paid plan, and therefore whether the
 * upgrade prompts (premium locks, "Upgrade plan", "Upgrade to Premium") should
 * be on screen at all.
 *
 * The default is "show the upgrade CTA": a free employer, and an employer whose
 * plan has not loaded yet, both see it. It disappears only once we positively
 * know the account is on a paid plan — which is what happens when an admin
 * grants them a subscription — or when billing is switched off site-wide.
 */
export function useEmployerPlan() {
  const { isLoggedIn } = useAuth();
  const { subscriptionsEnabled } = useSubscriptionsEnabled();
  const { data, isLoading } = useGetMyUsageQuery(undefined, {
    skip: !isLoggedIn,
    refetchOnMountOrArgChange: 60,
  });

  const usage = data?.data;
  const plan = usage?.plan ?? null;

  // A granted subscription is any non-free plan that is currently active.
  const hasPaidPlan = Boolean(plan && plan.isFree === false && usage?.status === 'active');
  const isPremium = hasPaidPlan && plan?.planKey === 'employer_premium';

  return {
    isLoading: isLoggedIn && isLoading,
    plan,
    planName: plan?.name ?? null,
    /** Any active paid plan (Premium or Pay Per Job). */
    hasPaidPlan,
    /** Specifically the Premium plan. */
    isPremium,
    /** Plan features merged with pay-per-job context — use this for feature gates. */
    features: usage?.effectiveFeatures ?? null,
    /**
     * Show the upgrade CTA by default; hide it once the account is on a paid
     * plan, or when the admin has turned billing off entirely.
     */
    showUpgrade: subscriptionsEnabled && !hasPaidPlan,
  };
}

export default useEmployerPlan;
