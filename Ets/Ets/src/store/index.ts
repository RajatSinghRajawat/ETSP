import { configureStore } from '@reduxjs/toolkit';
import { candidateProfileApi } from './api/candidateProfileApi';
import { employerProfileApi } from './api/employerProfileApi';
import { jobApi } from './api/jobApi';
import { applicationApi } from './api/applicationApi';
import { savedJobApi } from './api/savedJobApi';
import { chatApi } from './api/chatApi';
import { lookupApi } from './api/lookupApi';
import { resumeApi } from './api/resumeApi';
import { aiAssistantApi } from './api/aiAssistantApi';
import { subscriptionApi } from './api/subscriptionApi';
import { purchaseApi } from './api/purchaseApi';

export const store = configureStore({
  reducer: {
    [candidateProfileApi.reducerPath]: candidateProfileApi.reducer,
    [employerProfileApi.reducerPath]: employerProfileApi.reducer,
    [jobApi.reducerPath]: jobApi.reducer,
    [applicationApi.reducerPath]: applicationApi.reducer,
    [savedJobApi.reducerPath]: savedJobApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [lookupApi.reducerPath]: lookupApi.reducer,
    [resumeApi.reducerPath]: resumeApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    [purchaseApi.reducerPath]: purchaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      candidateProfileApi.middleware,
      employerProfileApi.middleware,
      jobApi.middleware,
      applicationApi.middleware,
      savedJobApi.middleware,
      chatApi.middleware,
      lookupApi.middleware,
      resumeApi.middleware,
      aiAssistantApi.middleware,
      subscriptionApi.middleware,
      purchaseApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
