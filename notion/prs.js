import { notion } from './client.js';
import { config } from '../config.js';

export async function prExists(url) {
  const response = await notion.databases.query({
    database_id: config.notion.prsDatabaseId,
    filter: {
      property: 'URL',
      url: { equals: url }
    }
  });
  return response.results.length > 0;
}

export async function addPRToReview({ title, repo, author, url }) {
  const exists = await prExists(url);
  if (exists) {
    console.log(`⏭️ PR already exists: ${title}`);
    return null;
  }

  await notion.pages.create({
    parent: { database_id: config.notion.prsDatabaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Repo: { rich_text: [{ text: { content: repo } }] },
      Author: { rich_text: [{ text: { content: author } }] },
      URL: { url: url },
      Status: { select: { name: 'Pending' } },
    }
  });

  console.log(`✅ Added PR to review: ${title}`);
}