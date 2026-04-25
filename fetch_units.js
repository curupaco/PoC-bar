const https = require('https');

https.get('https://poc-botequista-default-rtdb.firebaseio.com/units.json?auth=REMOVED_FIREBASE_API_KEY', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500)); // Print just a snippet to see what's there
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
