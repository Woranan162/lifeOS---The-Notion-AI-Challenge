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
    projectsDatabaseId: process.env.NOTION_PROJECTS_DB_ID,
    subtasksDatabaseId: process.env.NOTION_SUBTASKS_DB_ID,
    prsDatabaseId: process.env.NOTION_PRS_DB_ID,
    calendarDatabaseId: process.env.NOTION_CALENDAR_DB_ID,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME,
    reposToScan: process.env.REPOS_TO_SCAN?.split(',') || [],
  }
};