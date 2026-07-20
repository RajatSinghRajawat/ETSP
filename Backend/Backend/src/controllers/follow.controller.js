import { followEmployer, unfollowEmployer } from '../services/follow.service.js';

export async function postFollowEmployer(request, reply) {
  const data = await followEmployer(request.user, request.params.id);

  return reply.code(201).send({
    success: true,
    message: 'Employer followed successfully',
    data,
  });
}

export async function deleteFollowEmployer(request) {
  const data = await unfollowEmployer(request.user, request.params.id);

  return {
    success: true,
    message: 'Employer unfollowed successfully',
    data,
  };
}
