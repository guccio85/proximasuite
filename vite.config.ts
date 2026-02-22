import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      host: true,
      port: 3000,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '192.168.178.109',
        '*.ngrok-free.dev',
        '*.ngrok.dev'
      ],
      // ❌ RIMOSSO IL PROXY
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:3001',
      //     changeOrigin: true
      //   }
      // }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
