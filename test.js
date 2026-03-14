import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

console.log('databases:', notion.databases);
console.log('query fn:', notion.databases.query);

const response = await notion.databases.query({
  database_id: process.env.NOTION_TASKS_DB_ID,
});

console.log('results:', response.results.length);