import dotenv from 'dotenv';
dotenv.config();

export const config = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  notion: {
    token: process.env.NOTION_TOKEN,
    tasksDatabaseId: process.env.NOTION_TASKS_DB_ID,
    backlogDatabaseId: process.env.NOTION_BACKLOG_DB_ID,
    briefingPageId: process.env.NOTION_BRIEFING_PAGE_ID,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME,
  },
};