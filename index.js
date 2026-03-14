import OpenAI from 'openai';
import { config } from './config.js';
import { testNotionConnection } from './notion/client.js';
import { createTask, getOpenTasks } from './notion/tasks.js';

const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

async function testFullConnection() {
  console.log('🚀 Testing Life OS connections...\n');

  // 1. Test Notion
  await testNotionConnection();

  // 2. Create a test task
  await createTask({
    name: 'Test task from Life OS',
    source: 'Manual',
    priority: 'Low',
    notes: 'This was created automatically!'
  });
  console.log('✅ Created test task in Notion');

  // 3. Fetch tasks and ask DeepSeek about them
  const tasks = await getOpenTasks();
  console.log(`✅ Fetched ${tasks.length} open tasks from Notion`);

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: `Here are my current open tasks: ${JSON.stringify(tasks, null, 2)}. 
        Summarize them and tell me what I should focus on first.`
      }
    ],
    max_tokens: 500,
  });

  console.log('\n🤖 DeepSeek says:');
  console.log(response.choices[0].message.content);
}

testFullConnection();

import { fetchGitHubItems } from './connectors/github.js';
import { addToBacklog } from './notion/backlog.js';

async function testGitHub() {
  const items = await fetchGitHubItems();

  if (items.length === 0) {
    console.log('No open GitHub items found — try creating a test issue on any repo!');
    return;
  }

  for (const item of items) {
    await addToBacklog(item);
    console.log(`✅ Added to Notion backlog: ${item.title}`);
  }
}

testGitHub();

import { fetchRecentEmails } from './connectors/gmail.js';

async function testGmail() {
  const emails = await fetchRecentEmails();
  console.log(emails);
}

testGmail();