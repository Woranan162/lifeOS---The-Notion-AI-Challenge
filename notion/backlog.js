import { notion } from './client.js';
import { config } from '../config.js';

export async function addToBacklog({ title, repo, type, url }) {
  return await notion.pages.create({
    parent: { database_id: config.notion.backlogDatabaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Repo: { rich_text: [{ text: { content: repo } }] },
      Type: { select: { name: type } },
      URL: { url: url },
      Status: { select: { name: 'Open' } },
    }
  });
}