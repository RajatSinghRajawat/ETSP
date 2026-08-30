import { configureStore } from '@reduxjs/toolkit';
import { candidateProfileApi } from './api/candidateProfileApi';
import { employerProfileApi } from './api/employerProfileApi';
import { jobApi } from './api/jobApi';
import { applicationApi } from './api/applicationApi';
import { bannerApi } from './api/bannerApi';
import { savedJobApi } from './api/savedJobApi';
import { chatApi } from './api/chatApi';
import { notificationApi } from './api/notificationApi';
import { verificationApi } from './api/verificationApi';
import { lookupApi } from './api/lookupApi';
import { resumeApi } from './api/resumeApi';
import { aiAssistantApi } from './api/aiAssistantApi';
import { subscriptionApi } from './api/subscriptionApi';
import { purchaseApi } from './api/purchaseApi';
import { siteContentApi } from './api/siteContentApi';
import { supportTicketApi } from './api/supportTicketApi';
import { AUTH_CHANGED_EVENT } from '../hooks/useAuth';

export const store = configureStore({
  reducer: {
    [candidateProfileApi.reducerPath]: candidateProfileApi.reducer,
    [employerProfileApi.reducerPath]: employerProfileApi.reducer,
    [jobApi.reducerPath]: jobApi.reducer,
    [applicationApi.reducerPath]: applicationApi.reducer,
    [savedJobApi.reducerPath]: savedJobApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [verificationApi.reducerPath]: verificationApi.reducer,
    [lookupApi.reducerPath]: lookupApi.reducer,
    [resumeApi.reducerPath]: resumeApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    [purchaseApi.reducerPath]: purchaseApi.reducer,
    [siteContentApi.reducerPath]: siteContentApi.reducer,
    [bannerApi.reducerPath]: bannerApi.reducer,
    [supportTicketApi.reducerPath]: supportTicketApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      candidateProfileApi.middleware,
      employerProfileApi.middleware,
      jobApi.middleware,
      applicationApi.middleware,
      savedJobApi.middleware,
      chatApi.middleware,
      notificationApi.middleware,
      verificationApi.middleware,
      lookupApi.middleware,
      resumeApi.middleware,
      aiAssistantApi.middleware,
      subscriptionApi.middleware,
      purchaseApi.middleware,
      siteContentApi.middleware,
      bannerApi.middleware,
      supportTicketApi.middleware,
    ),
});

// Every cache below is scoped to the signed-in account (a job even carries the
// viewer's own `hasApplied`). Logging in, switching profile or logging out must
// therefore drop them, or the next role would render the previous one's data.
// Public caches (lookups, site content, banners) are left alone so the page does
// not flicker on a session change.
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_CHANGED_EVENT, () => {
    store.dispatch(candidateProfileApi.util.resetApiState());
    store.dispatch(employerProfileApi.util.resetApiState());
    store.dispatch(jobApi.util.resetApiState());
    store.dispatch(applicationApi.util.resetApiState());
    store.dispatch(savedJobApi.util.resetApiState());
    store.dispatch(chatApi.util.resetApiState());
    store.dispatch(notificationApi.util.resetApiState());
    store.dispatch(resumeApi.util.resetApiState());
    store.dispatch(aiAssistantApi.util.resetApiState());
    store.dispatch(subscriptionApi.util.resetApiState());
    store.dispatch(purchaseApi.util.resetApiState());
    store.dispatch(supportTicketApi.util.resetApiState());
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
