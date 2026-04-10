const axios = require('axios');
require('dotenv').config();

const url = process.env.VITE_FIREBASE_DATABASE_URL;
const key = process.env.VITE_FIREBASE_API_KEY;
const email = process.env.VITE_FIREBASE_EMAIL;
const pass = process.env.VITE_FIREBASE_PASSWORD;

async function migrate() {
  try {
    // 1. Auth
    console.log("Authenticating...");
    const authRes = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
      email, password: pass, returnSecureToken: true
    });
    const idToken = authRes.data.idToken;

    // 2. Fetch Units and Users
    console.log("Fetching units and users...");
    const nodes = ['units', 'users'];
    const [unitsRaw, usersRaw] = await Promise.all(nodes.map(n => axios.get(`${url}/${n}.json?auth=${idToken}`)));
    
    const units = unitsRaw.data || {};
    const users = usersRaw.data || {};

    console.log("Current Units:", Object.keys(units));
    console.log("Current Users:", Object.keys(users).map(k => users[k].username));

    // 3. Create Franchise
    console.log("Creating 'Hilário' franchise...");
    const franchiseId = 'hilario';
    await axios.put(`${url}/franchises/${franchiseId}.json?auth=${idToken}`, {
      id: franchiseId,
      name: 'Hilário',
      createdAt: Date.now()
    });

    // 4. Update Units
    console.log("Updating units with franchiseId...");
    for (const unitId in units) {
      await axios.patch(`${url}/units/${unitId}.json?auth=${idToken}`, {
        franchiseId: franchiseId
      });
    }

    // 5. Update OZZY
    console.log("Updating OZZY permissions...");
    const ozzyEntry = Object.entries(users).find(([id, u]) => u.username.toLowerCase() === 'ozzy');
    if (ozzyEntry) {
      const [id, u] = ozzyEntry;
      const perms = u.permissions || [];
      if (!perms.includes('franchise_admin')) perms.push('franchise_admin');
      
      await axios.patch(`${url}/users/${id}.json?auth=${idToken}`, {
        franchiseId: franchiseId,
        permissions: perms
      });
      console.log(`User ${u.username} updated.`);
    } else {
      console.log("User OZZY not found.");
    }

    console.log("Migration complete!");
  } catch (e) {
    console.error("Migration failed:", e.response?.data || e.message);
  }
}

migrate();
