import { loadFromFirebase, getFirebaseToken } from './src/services/firebaseService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.VITE_FIREBASE_DATABASE_URL;
  const key = process.env.VITE_FIREBASE_API_KEY;
  const email = process.env.VITE_FIREBASE_EMAIL;
  const pass = process.env.VITE_FIREBASE_PASSWORD;

  const token = await getFirebaseToken(email, pass, key);
  console.log("Token obtained:", !!token);

  const units = await loadFromFirebase(url, undefined, token, 'units');
  console.log("Units keys:", Object.keys(units || {}));
  
  if (units) {
      Object.keys(units).forEach(k => {
          console.log(`Unit ${k}: name=${units[k].name}, useStock=${units[k].useStock}`);
      });
  }

  const products = await loadFromFirebase(url, undefined, token, 'data/units/principal/products');
  console.log("Products count in principal:", Array.isArray(products) ? products.length : Object.keys(products || {}).length);
  
  if (Array.isArray(products)) {
      const cacheta = products.filter(p => p.category === 'CACHETA');
      const others = products.filter(p => p.category !== 'CACHETA');
      console.log("Cacheta products:", cacheta.length);
      console.log("Other products:", others.length);
      if (others.length > 0) {
          console.log("Sample other product:", { name: others[0].name, stock: others[0].stock, trackStock: others[0].trackStock });
      }
  }
}
run();
