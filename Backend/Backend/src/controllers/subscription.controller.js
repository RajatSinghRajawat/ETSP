import {
  cancelMySubscription,
  confirmMyCheckout,
  createCheckoutSession,
  getMySubscription,
  getMyUsage,
  grantSubscriptionAdmin,
  listSubscriptionsAdmin,
} from '../services/subscription.service.js';

export async function getMe(request) {
  const data = await getMySubscription(request.user);

  return {
    success: true,
    message: 'Subscription fetched successfully',
    data,
  };
}

export async function getUsage(request) {
  const data = await getMyUsage(request.user);

  return {
    success: true,
    message: 'Usage fetched successfully',
    data,
  };
}

export async function postCheckout(request, reply) {
  const data = await createCheckoutSession(
    request.user,
    request.body.planId,
    request.body.billingInterval ?? 'month',
  );

  return reply.code(201).send({
    success: true,
    message: 'Checkout session created successfully',
    data,
  });
}

export async function postConfirm(request) {
  const data = await confirmMyCheckout(request.user, request.body.sessionId);

  return {
    success: true,
    message: 'Subscription activated successfully',
    data,
  };
}

export async function postCancel(request) {
  const data = await cancelMySubscription(request.user);

  return {
    success: true,
    message: 'Subscription will be canceled at the end of the current period',
    data,
  };
}

export async function getAdminSubscriptions(request) {
  const data = await listSubscriptionsAdmin(request.query);

  return {
    success: true,
    message: 'Subscriptions fetched successfully',
    data,
  };
}

export async function postGrantSubscription(request, reply) {
  const data = await grantSubscriptionAdmin(request.body);

  return reply.code(201).send({
    success: true,
    message: 'Subscription granted successfully',
    data,
  });
}
