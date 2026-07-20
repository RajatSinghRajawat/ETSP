import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type ChatRole = 'employer' | 'candidate';

export interface ConversationSummary {
  _id: string;
  job: string | null;
  jobTitle: string;
  peerName: string;
  peerRole: ChatRole;
  lastMessage: string;
  lastMessageAt: string | null;
  lastMessageSender: ChatRole | null;
  unread: number;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  senderRole: ChatRole;
  text: string;
  createdAt: string;
}

export interface StartConversationPayload {
  peerProfileId: string;
  jobId?: string;
  text: string;
}

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Conversations', 'Messages', 'Unread'],
  endpoints: (builder) => ({
    getConversations: builder.query<ApiResponse<{ items: ConversationSummary[] }>, void>({
      query: () => ({ url: API_ENDPOINTS.chatConversations }),
      providesTags: ['Conversations'],
    }),
    getMessages: builder.query<
      ApiResponse<{ conversation: ConversationSummary; messages: ChatMessage[] }>,
      string
    >({
      query: (conversationId) => ({ url: API_ENDPOINTS.chatConversationMessages(conversationId) }),
      providesTags: (_result, _error, id) => [{ type: 'Messages', id }],
    }),
    getUnreadCount: builder.query<ApiResponse<{ total: number }>, void>({
      query: () => ({ url: API_ENDPOINTS.chatUnreadCount }),
      providesTags: ['Unread'],
    }),
    startConversation: builder.mutation<
      ApiResponse<{ conversationId: string; message: ChatMessage }>,
      StartConversationPayload
    >({
      query: (body) => ({
        url: API_ENDPOINTS.chatConversations,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Conversations', 'Unread'],
    }),
    sendMessage: builder.mutation<
      ApiResponse<{ conversationId: string; message: ChatMessage }>,
      { conversationId: string; text: string }
    >({
      query: ({ conversationId, text }) => ({
        url: API_ENDPOINTS.chatConversationMessages(conversationId),
        method: 'POST',
        data: { text },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Messages', id: conversationId },
        'Conversations',
      ],
    }),
    markConversationRead: builder.mutation<ApiResponse<{ conversationId: string }>, string>({
      query: (conversationId) => ({
        url: API_ENDPOINTS.chatConversationRead(conversationId),
        method: 'PATCH',
      }),
      invalidatesTags: ['Conversations', 'Unread'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetUnreadCountQuery,
  useStartConversationMutation,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} = chatApi;
