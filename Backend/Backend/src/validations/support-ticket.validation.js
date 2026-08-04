import { z } from 'zod';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../models/support-ticket.model.js';

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Please describe your issue').max(5000),
  category: z.enum(TICKET_CATEGORIES).optional().default('other'),
  priority: z.enum(TICKET_PRIORITIES).optional().default('normal'),
});

export const replyTicketSchema = z.object({
  message: z.string().trim().min(2, 'Please enter a message').max(5000),
});

export const adminRespondTicketSchema = z
  .object({
    message: z.string().trim().max(5000).optional(),
    status: z.enum(TICKET_STATUSES).optional(),
  })
  .refine((data) => Boolean(data.message?.trim()) || Boolean(data.status), {
    message: 'Provide a reply or a status change',
  });
