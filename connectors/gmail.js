import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
];const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

function loadCredentials() {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  return JSON.parse(content);
}

async function authorize() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob');

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  }

  // Get new token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔗 Authorize Life OS by visiting this URL:\n', authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => rl.question('\nEnter the code from that page: ', resolve));
  rl.close();

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Gmail token saved!');

  return oAuth2Client;
}

export async function fetchRecentEmails() {
  console.log('📧 Fetching recent emails...');
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const { data } = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5,
    q: 'is:unread newer_than:1d',
  });

  if (!data.messages || data.messages.length === 0) {
    console.log('No unread emails found');
    return [];
  }

  const emails = [];
  for (const msg of data.messages) {
    const { data: email } = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From'],
    });

    const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = email.payload.headers.find(h => h.name === 'From')?.value || 'Unknown';
    const snippet = email.snippet;

    emails.push({ subject, from, snippet, id: msg.id });
  }

  console.log(`✅ Found ${emails.length} unread emails`);
  return emails;
}