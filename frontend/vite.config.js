import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Desired port
    host: '0.0.0.0', // Bind to all interfaces
    strictPort: false, // Fallback to another port if 3000 is taken
    open: true, // Automatically open the browser (optional)
  },
});
