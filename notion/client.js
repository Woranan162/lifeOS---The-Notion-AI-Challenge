import { Client } from '@notionhq/client';
import { config } from '../config.js';

export const notion = new Client({ auth: config.notion.token });

// ✅ Test connection
export async function testNotionConnection() {
  try {
    const response = await notion.users.me();
    console.log(`✅ Notion connected as: ${response.name}`);
    return true;
  } catch (err) {
    console.error('❌ Notion connection failed:', err.message);
    return false;
  }
}