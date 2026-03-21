import { loadEnv } from 'vite';
process.env.VITE_FIREBASE_API_KEY = 'TEST_KEY_FROM_VERCEL';
const env = loadEnv('production', '.', '');
console.log('API_KEY in env:', env.VITE_FIREBASE_API_KEY);
