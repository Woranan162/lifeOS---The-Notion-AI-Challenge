import { notion } from './client.js';
import { config } from '../config.js';

export async function writeDailyBriefing(content) {
  const today = new Date().toDateString();

  // Create a new page under the briefing page
  await notion.pages.create({
    parent: { page_id: config.notion.briefingPageId },
    properties: {
      title: {
        title: [{ text: { content: `Daily Briefing — ${today}` } }]
      }
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      }
    ]
  });
}