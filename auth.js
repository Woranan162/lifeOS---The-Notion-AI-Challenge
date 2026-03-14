import { google } from 'googleapis';
import fs from 'fs';
import http from 'http';
import { URL } from 'url';

const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id } = credentials.web || credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:3000'
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n🔗 Opening authorization URL...');
console.log('\nOpen this in your browser:\n');
console.log(authUrl);
console.log('\n⏳ Waiting for authorization...\n');

// Start a local server to catch the redirect
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost:3000');
    const code = url.searchParams.get('code');

    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>✅ Authorization successful! You can close this tab and go back to your terminal.</h1>');

      const { tokens } = await oAuth2Client.getToken(code);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('✅ token.json saved! Now run: node index.js');

      server.close();
      process.exit(0);
    }
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500);
    res.end('Error');
  }
});

server.listen(3000, () => {
  console.log('🌐 Listening on http://localhost:3000');
});