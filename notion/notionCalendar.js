import { notion } from './client.js';
import { config } from '../config.js';

export async function getTodayTimeBlocks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const response = await notion.databases.query({
    database_id: config.notion.calendarDatabaseId,
    filter: {
      property: 'Date',
      date: {
        on_or_after: today.toISOString(),
        before: tomorrow.toISOString(),
      }
    }
  });

  return response.results.map(page => ({
    id: page.id,
    name: page.properties.Name.title[0]?.plain_text,
    start: page.properties.Date.date?.start,
    end: page.properties.Date.date?.end,
  }));
}

export async function createTimeBlock({ name, task, startTime, endTime }) {
  await notion.pages.create({
    parent: { database_id: config.notion.calendarDatabaseId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Task: { rich_text: [{ text: { content: task } }] },
      Date: { date: { start: startTime, end: endTime } },
      Type: { select: { name: 'Work' } },
    }
  });
  console.log(`✅ Created time block: ${name}`);
}