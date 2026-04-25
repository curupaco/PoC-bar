import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(env.VITE_FIREBASE_DATABASE_URL),
      'import.meta.env.VITE_FIREBASE_EMAIL': JSON.stringify(env.VITE_FIREBASE_EMAIL),
      'import.meta.env.VITE_FIREBASE_PASSWORD': JSON.stringify(env.VITE_FIREBASE_PASSWORD)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    // @ts-ignore
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './tests/setup.ts',
    },
  };
});
