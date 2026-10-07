import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy so the browser sees the API as same-origin — no CORS setup needed.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
