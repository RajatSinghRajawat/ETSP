import {
  ADDONS,
  confirmPurchase,
  createPurchaseCheckout,
  listMyPurchases,
  listPurchasesAdmin,
} from '../services/purchase.service.js';

export async function postPurchaseCheckout(request, reply) {
  const data = await createPurchaseCheckout(request.user, {
    type: request.body.type,
    jobId: request.body.jobId ?? null,
  });

  return reply.code(201).send({
    success: true,
    message: 'Checkout session created successfully',
    data,
  });
}

export async function postPurchaseConfirm(request) {
  const data = await confirmPurchase(request.user, request.body.sessionId);

  return {
    success: true,
    message: 'Purchase completed successfully',
    data,
  };
}

export async function getMyPurchases(request) {
  const data = await listMyPurchases(request.user);

  return {
    success: true,
    message: 'Purchases fetched successfully',
    data,
  };
}

export async function getAddonCatalog() {
  return {
    success: true,
    message: 'Add-on catalog fetched successfully',
    data: { addons: ADDONS },
  };
}

export async function getAdminPurchases(request) {
  const data = await listPurchasesAdmin(request.query);

  return {
    success: true,
    message: 'Purchases fetched successfully',
    data,
  };
}
