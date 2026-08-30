import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type NotificationType =
  | 'application_submitted'
  | 'application_viewed'
  | 'application_reviewing'
  | 'application_shortlisted'
  | 'application_rejected'
  | 'application_hired'
  | 'interview_scheduled'
  | 'general';

export type NotificationMeta = {
  applicationId?: string;
  jobId?: string | null;
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  status?: string;
  interviewAt?: string | null;
  employerMessage?: string;
};

export type NotificationItem = {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  readAt: string | null;
  meta: NotificationMeta;
  createdAt: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unread?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type NotificationList = {
  items: NotificationItem[];
  unread: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notifications', 'NotificationUnread'],
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<NotificationList>, NotificationListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.notifications,
        params: params ?? undefined,
      }),
      providesTags: ['Notifications'],
    }),
    getNotificationUnreadCount: builder.query<ApiResponse<{ unread: number }>, void>({
      query: () => ({ url: API_ENDPOINTS.notificationUnreadCount }),
      providesTags: ['NotificationUnread'],
    }),
    markNotificationRead: builder.mutation<ApiResponse<NotificationItem>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.notificationRead(id),
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications', 'NotificationUnread'],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<{ updated: number; unread: number }>, void>({
      query: () => ({
        url: API_ENDPOINTS.notificationsReadAll,
        method: 'POST',
      }),
      invalidatesTags: ['Notifications', 'NotificationUnread'],
    }),
    deleteNotification: builder.mutation<ApiResponse<{ _id: string }>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.notificationById(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications', 'NotificationUnread'],
    }),
  }),
});

export const {
  useDeleteNotificationMutation,
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationApi;
