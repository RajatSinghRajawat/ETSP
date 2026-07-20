import {
  createPlan,
  deactivatePlan,
  listPlansAdmin,
  listPublicPlans,
  resyncPlan,
  updatePlan,
} from '../services/plan.service.js';

export async function getAdminPlans(request) {
  const items = await listPlansAdmin(request.query);

  return {
    success: true,
    message: 'Plans fetched successfully',
    data: { items },
  };
}

export async function postPlan(request, reply) {
  const plan = await createPlan(request.body);

  return reply.code(201).send({
    success: true,
    message: 'Plan created successfully',
    data: plan,
  });
}

export async function patchPlan(request) {
  const plan = await updatePlan(request.params.id, request.body);

  return {
    success: true,
    message: 'Plan updated successfully',
    data: plan,
  };
}

export async function removePlan(request) {
  const plan = await deactivatePlan(request.params.id);

  return {
    success: true,
    message: 'Plan deactivated successfully',
    data: plan,
  };
}

export async function postPlanSync(request) {
  const plan = await resyncPlan(request.params.id);

  return {
    success: true,
    message: 'Plan synced with Stripe successfully',
    data: plan,
  };
}

export async function getPublicPlans(request) {
  const items = await listPublicPlans(String(request.query.audience || '').trim());

  return {
    success: true,
    message: 'Plans fetched successfully',
    data: { items },
  };
}
