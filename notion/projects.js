import { notion } from './client.js';
import { config } from '../config.js';

// Check if project already exists
export async function projectExists(repoName) {
  const response = await notion.databases.query({
    database_id: config.notion.projectsDatabaseId,
    filter: {
      property: 'Repo',
      rich_text: { equals: repoName }
    }
  });
  return response.results.length > 0 ? response.results[0] : null;
}

// Create or update a project
export async function upsertProject({ name, repo, description }) {
  const existing = await projectExists(repo);

  if (existing) {
    await notion.pages.update({
      page_id: existing.id,
      properties: {
        'Last Scanned': { date: { start: new Date().toISOString() } },
      }
    });
    console.log(`🔄 Updated project: ${name}`);
    return existing.id;
  }

  const page = await notion.pages.create({
    parent: { database_id: config.notion.projectsDatabaseId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Repo: { rich_text: [{ text: { content: repo } }] },
      Description: { rich_text: [{ text: { content: description || '' } }] },
      Status: { select: { name: 'Active' } },
      'Last Scanned': { date: { start: new Date().toISOString() } },
    }
  });

  console.log(`✅ Created project: ${name}`);
  return page.id;
}

// Get all active projects
export async function getActiveProjects() {
  const response = await notion.databases.query({
    database_id: config.notion.projectsDatabaseId,
    filter: {
      property: 'Status',
      select: { equals: 'Active' }
    }
  });

  return response.results.map(page => ({
    id: page.id,
    name: page.properties.Name.title[0]?.plain_text,
    repo: page.properties.Repo.rich_text[0]?.plain_text,
  }));
}