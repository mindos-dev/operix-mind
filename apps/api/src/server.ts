import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createApp();
    app.listen(PORT, () => {
      console.log(`🚀 OPERIX Mind API running on http://localhost:${PORT}`);
      console.log(`📡 Health: http://localhost:${PORT}/health`);
      console.log(`🔧 Setup: http://localhost:${PORT}/setup`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
