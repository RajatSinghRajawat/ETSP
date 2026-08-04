import {
  getMyTicketById,
  getMyTickets,
  postCloseMyTicket,
  postMyTicketReply,
  postTicket,
} from '../controllers/support-ticket.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  createTicketSchema,
  replyTicketSchema,
} from '../validations/support-ticket.validation.js';

/**
 * Support tickets raised by candidates and employers from their dashboards.
 * GET    /support-tickets/me
 * POST   /support-tickets
 * GET    /support-tickets/:id
 * POST   /support-tickets/:id/reply
 * POST   /support-tickets/:id/close
 */
export async function supportTicketRoutes(app) {
  app.get('/me', { preHandler: authenticate }, getMyTickets);
  app.post(
    '/',
    { preHandler: [authenticate, validateBody(createTicketSchema)] },
    postTicket,
  );
  app.get('/:id', { preHandler: authenticate }, getMyTicketById);
  app.post(
    '/:id/reply',
    { preHandler: [authenticate, validateBody(replyTicketSchema)] },
    postMyTicketReply,
  );
  app.post('/:id/close', { preHandler: authenticate }, postCloseMyTicket);
}
