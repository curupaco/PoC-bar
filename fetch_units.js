require('dotenv').config();
const apiKey = process.env.VITE_FIREBASE_API_KEY || '';
const dbUrl = process.env.VITE_FIREBASE_DATABASE_URL || 'https://poc-botequista-default-rtdb.firebaseio.com';

https.get(`${dbUrl}/units.json?auth=${apiKey}`, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500)); // Print just a snippet to see what's there
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
