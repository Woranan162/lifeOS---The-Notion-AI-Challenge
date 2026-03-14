import { notion } from './client.js';
import { config } from '../config.js';

// Check if subtask already exists
export async function subtaskExists(name, project) {
  const response = await notion.databases.query({
    database_id: config.notion.subtasksDatabaseId,
    filter: {
      and: [
        { property: 'Name', title: { equals: name } },
        { property: 'Project', rich_text: { equals: project } },
      ]
    }
  });
  return response.results.length > 0;
}

// Create a subtask
export async function createSubtask({ name, project, estimatedHours, githubIssueUrl }) {
  const exists = await subtaskExists(name, project);
  if (exists) {
    console.log(`⏭️ Subtask already exists: ${name}`);
    return null;
  }

  const page = await notion.pages.create({
    parent: { database_id: config.notion.subtasksDatabaseId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Project: { rich_text: [{ text: { content: project } }] },
      'Estimated Hours': { number: estimatedHours || 1 },
      Status: { select: { name: 'Todo' } },
      ...(githubIssueUrl && { 'GitHub Issue URL': { url: githubIssueUrl } }),
    }
  });

  console.log(`✅ Created subtask: ${name}`);
  return page.id;
}

// Get all todo subtasks
export async function getTodoSubtasks() {
  const response = await notion.databases.query({
    database_id: config.notion.subtasksDatabaseId,
    filter: {
      property: 'Status',
      select: { does_not_equal: 'Done' }
    }
  });

  return response.results.map(page => ({
    id: page.id,
    name: page.properties.Name.title[0]?.plain_text,
    project: page.properties.Project.rich_text[0]?.plain_text,
    estimatedHours: page.properties['Estimated Hours'].number || 1,
    githubIssueUrl: page.properties['GitHub Issue URL']?.url,
    status: page.properties.Status.select?.name,
  }));
}

// Update subtask status
export async function updateSubtaskStatus(pageId, status) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: status } }
    }
  });
  console.log(`🔄 Updated subtask status to: ${status}`);
}