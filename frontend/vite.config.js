import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
    allowedHosts: ['changes-1.onrender.com'],
    proxy: {
      '/api': {
        target: 'https://changes-1.onrender.com', // Proxy API requests to this host
        changeOrigin: true, // Modify the request origin to match the target
        secure: true, // Use true for HTTPS, false if HTTP
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite /api prefix if needed
      },
    },
  },
});
