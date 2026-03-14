import { notion } from './client.js';
import { config } from '../config.js';

console.log('notion keys', Object.keys(notion));

// Create a task in Notion
export async function createTask({ name, source, priority, notes, dueDate }) {
  return await notion.pages.create({
    parent: { database_id: config.notion.tasksDatabaseId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Source: { select: { name: source || 'Manual' } },
      Priority: { select: { name: priority || 'Medium' } },
      Status: { select: { name: 'Todo' } },
      ...(dueDate && { 'Due Date': { date: { start: dueDate } } }),
      ...(notes && { Notes: { rich_text: [{ text: { content: notes } }] } }),
    }
  });
}

// Get all open tasks
export async function getOpenTasks() {
  const response = await notion.databases.query({
    database_id: config.notion.tasksDatabaseId,
    filter: {
      property: 'Status',
      select: { does_not_equal: 'Done' }
    }
  });

  return response.results.map(page => ({
    id: page.id,
    name: page.properties.Name.title[0]?.plain_text,
    priority: page.properties.Priority.select?.name,
    source: page.properties.Source.select?.name,
    dueDate: page.properties['Due Date']?.date?.start,
  }));
}