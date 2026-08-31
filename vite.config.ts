import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const firebaseApiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '';
  const firebaseDbUrl = env.VITE_FIREBASE_DATABASE_URL || env.FIREBASE_URL || '';
  const firebaseEmail = env.VITE_FIREBASE_EMAIL || env.FIREBASE_EMAIL || '';
  const firebasePassword = env.VITE_FIREBASE_PASSWORD || env.FIREBASE_PASSWORD || '';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(firebaseDbUrl),
      'import.meta.env.VITE_FIREBASE_EMAIL': JSON.stringify(firebaseEmail),
      'import.meta.env.VITE_FIREBASE_PASSWORD': JSON.stringify(firebasePassword)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-recharts': ['recharts'],
            'vendor-utils': ['axios', 'idb', 'crypto-js']
          }
        }
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
