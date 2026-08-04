import {
  closeMyTicket,
  createTicket,
  deleteTicketAdmin,
  getMyTicket,
  getTicketAdmin,
  listMyTickets,
  listTicketsAdmin,
  replyToMyTicket,
  respondToTicketAdmin,
} from '../services/support-ticket.service.js';

export async function postTicket(request, reply) {
  const data = await createTicket(request.user, request.body);

  return reply.code(201).send({
    success: true,
    message: 'Support ticket raised successfully',
    data,
  });
}

export async function getMyTickets(request) {
  const data = await listMyTickets(request.user);

  return {
    success: true,
    message: 'Support tickets fetched successfully',
    data,
  };
}

export async function getMyTicketById(request) {
  const data = await getMyTicket(request.user, request.params.id);

  return {
    success: true,
    message: 'Support ticket fetched successfully',
    data,
  };
}

export async function postMyTicketReply(request) {
  const data = await replyToMyTicket(request.user, request.params.id, request.body?.message);

  return {
    success: true,
    message: 'Reply sent successfully',
    data,
  };
}

export async function postCloseMyTicket(request) {
  const data = await closeMyTicket(request.user, request.params.id);

  return {
    success: true,
    message: 'Ticket closed',
    data,
  };
}

/* ------------------------------------------------------------------ admin */

export async function getAdminTickets(request) {
  const data = await listTicketsAdmin(request.query);

  return {
    success: true,
    message: 'Support tickets fetched successfully',
    data,
  };
}

export async function getAdminTicket(request) {
  const data = await getTicketAdmin(request.params.id);

  return {
    success: true,
    message: 'Support ticket fetched successfully',
    data,
  };
}

export async function postAdminTicketResponse(request) {
  const data = await respondToTicketAdmin(request.params.id, request.body, request.user);

  return {
    success: true,
    message: 'Response sent and the user has been notified by email',
    data,
  };
}

export async function deleteAdminTicket(request) {
  await deleteTicketAdmin(request.params.id);

  return {
    success: true,
    message: 'Support ticket deleted',
    data: null,
  };
}
