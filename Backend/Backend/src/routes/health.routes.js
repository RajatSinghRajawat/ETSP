export async function healthRoutes(app) {
  app.get('/health', async () => ({
    success: true,
    message: 'API is healthy',
    data: {
      service: 'ets-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  }));
}
