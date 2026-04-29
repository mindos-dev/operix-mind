import { createApp } from './app.js';
import { env } from './config/env.js';
const app = createApp();
app.listen(env.port, () => {
    console.log(`API Mind_IA rodando em http://localhost:${env.port}`);
});
