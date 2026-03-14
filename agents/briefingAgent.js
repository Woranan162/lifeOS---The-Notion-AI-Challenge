import OpenAI from 'openai';
import { config } from '../config.js';
import { fetchRecentEmails } from '../connectors/gmail.js';
import { fetchGitHubItems } from '../connectors/github.js';
import { fetchTodayEvents } from '../connectors/calendar.js';
import { writeDailyBriefing } from '../notion/briefing.js';

const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

export async function runMorningBriefing() {
  console.log('\n🌅 Running Morning Briefing Agent...\n');

  // 1. Gather all data in parallel
  const [emails, githubItems, events] = await Promise.all([
    fetchRecentEmails(),
    fetchGitHubItems(),
    fetchTodayEvents(),
  ]);

  // 2. Ask DeepSeek to synthesize everything
  const prompt = `
You are a personal chief of staff. Based on the data below, write a concise daily briefing.

📧 UNREAD EMAILS (last 24hrs):
${emails.map(e => `- From: ${e.from} | Subject: ${e.subject} | Preview: ${e.snippet}`).join('\n')}

🐙 OPEN GITHUB ITEMS:
${githubItems.map(g => `- [${g.type}] ${g.title} in ${g.repo}`).join('\n')}

📅 TODAY'S CALENDAR EVENTS:
${events.map(e => `- ${e.start}: ${e.title}`).join('\n')}

Write the briefing in this exact format:
1. 📧 EMAILS TO ACTION (list top 3 with what to do)
2. 🐙 GITHUB FOCUS (list top 3 priorities)
3. 📅 TODAY'S SCHEDULE (list all events)
4. 🎯 TOP 3 PRIORITIES FOR TODAY (synthesized from everything above)

Be concise and actionable. Today's date is ${new Date().toDateString()}.
  `;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
  });

  const briefingContent = response.choices[0].message.content;
  console.log('\n🤖 Briefing generated!');
  console.log(briefingContent);

  // 3. Write to Notion
  await writeDailyBriefing(briefingContent);
  console.log('\n✅ Daily briefing written to Notion!');

  return briefingContent;
}