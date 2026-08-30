import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type OtpPhoneChannel = 'sms' | 'whatsapp';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SendOtpResult = {
  alreadyVerified: boolean;
  destination: string;
  channel?: OtpPhoneChannel;
  message: string;
};

/**
 * Pre-registration OTP verification — proves the email and phone belong to the
 * person signing up, before any account exists. Every endpoint is public.
 */
export const verificationApi = createApi({
  reducerPath: 'verificationApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    sendEmailOtp: builder.mutation<ApiResponse<SendOtpResult>, { email: string }>({
      query: (body) => ({ url: API_ENDPOINTS.verifyEmailSend, method: 'POST', data: body }),
    }),
    confirmEmailOtp: builder.mutation<
      ApiResponse<{ emailVerified: boolean; email: string }>,
      { email: string; otp: string }
    >({
      query: (body) => ({ url: API_ENDPOINTS.verifyEmailConfirm, method: 'POST', data: body }),
    }),
    sendPhoneOtp: builder.mutation<
      ApiResponse<SendOtpResult>,
      { phone: string; channel?: OtpPhoneChannel }
    >({
      query: (body) => ({ url: API_ENDPOINTS.verifyPhoneSend, method: 'POST', data: body }),
    }),
    confirmPhoneOtp: builder.mutation<
      ApiResponse<{ phoneVerified: boolean; phone: string }>,
      { phone: string; otp: string }
    >({
      query: (body) => ({ url: API_ENDPOINTS.verifyPhoneConfirmOtp, method: 'POST', data: body }),
    }),
  }),
});

export const {
  useConfirmEmailOtpMutation,
  useConfirmPhoneOtpMutation,
  useSendEmailOtpMutation,
  useSendPhoneOtpMutation,
} = verificationApi;
