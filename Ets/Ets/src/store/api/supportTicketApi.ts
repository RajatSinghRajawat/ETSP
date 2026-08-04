import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high';
export type TicketCategory =
  | 'account'
  | 'billing'
  | 'jobs'
  | 'applications'
  | 'technical'
  | 'other';

export type TicketMessage = {
  _id: string;
  body: string;
  authorRole: 'user' | 'admin';
  authorName?: string;
  authorEmail?: string;
  createdAt: string;
};

export type SupportTicket = {
  _id: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userEmail: string;
  userName?: string;
  userRole?: string;
  messages: TicketMessage[];
  lastMessageAt: string;
  unreadForUser: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketPayload = {
  subject: string;
  message: string;
  category?: TicketCategory;
  priority?: TicketPriority;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const supportTicketApi = createApi({
  reducerPath: 'supportTicketApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SupportTicket'],
  endpoints: (builder) => ({
    getMyTickets: builder.query<
      ApiResponse<{ items: SupportTicket[]; openCount: number; unreadCount: number }>,
      void
    >({
      query: () => ({ url: API_ENDPOINTS.mySupportTickets }),
      providesTags: ['SupportTicket'],
    }),
    getTicket: builder.query<ApiResponse<SupportTicket>, string>({
      query: (id) => ({ url: API_ENDPOINTS.supportTicketById(id) }),
      providesTags: ['SupportTicket'],
    }),
    createTicket: builder.mutation<ApiResponse<SupportTicket>, CreateTicketPayload>({
      query: (data) => ({
        url: API_ENDPOINTS.supportTickets,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),
    replyToTicket: builder.mutation<ApiResponse<SupportTicket>, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: API_ENDPOINTS.supportTicketReply(id),
        method: 'POST',
        data: { message },
      }),
      invalidatesTags: ['SupportTicket'],
    }),
    closeTicket: builder.mutation<ApiResponse<SupportTicket>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.supportTicketClose(id),
        method: 'POST',
      }),
      invalidatesTags: ['SupportTicket'],
    }),
  }),
});

export const {
  useGetMyTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
  useCloseTicketMutation,
} = supportTicketApi;
