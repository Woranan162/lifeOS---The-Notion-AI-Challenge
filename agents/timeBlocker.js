import OpenAI from 'openai';
import { config } from '../config.js';
import { getTodoSubtasks } from '../notion/subtasks.js';
import { getTodayTimeBlocks, createTimeBlock } from '../notion/notionCalendar.js';

const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

function getFreeSlots(existingBlocks) {
  // Work hours: 9AM - 6PM
  const workStart = 9;
  const workEnd = 18;
  const slots = [];

  // Build busy periods from existing blocks
  const busy = existingBlocks
    .filter(b => b.start && b.end)
    .map(b => ({
      start: new Date(b.start).getHours() + new Date(b.start).getMinutes() / 60,
      end: new Date(b.end).getHours() + new Date(b.end).getMinutes() / 60,
    }))
    .sort((a, b) => a.start - b.start);

  // Find free slots
  let current = workStart;
  for (const block of busy) {
    if (block.start > current) {
      slots.push({ start: current, end: block.start });
    }
    current = Math.max(current, block.end);
  }
  if (current < workEnd) {
    slots.push({ start: current, end: workEnd });
  }

  return slots;
}

function hoursToTime(date, hours) {
  const d = new Date(date);
  d.setHours(Math.floor(hours), (hours % 1) * 60, 0, 0);
  return d.toISOString();
}

export async function runTimeBlocker() {
  console.log('\n⏰ Running Time Blocker...\n');

  // 1. Get existing calendar blocks today
  const existingBlocks = await getTodayTimeBlocks();
  console.log(`📅 Found ${existingBlocks.length} existing blocks today`);

  // 2. Get free slots
  const freeSlots = getFreeSlots(existingBlocks);
  const totalFreeHours = freeSlots.reduce((sum, s) => sum + (s.end - s.start), 0);
  console.log(`🕐 Total free time today: ${totalFreeHours} hours`);

  if (totalFreeHours === 0) {
    console.log('📅 No free time today — skipping time blocking');
    return;
  }

  // 3. Get todo subtasks
  const subtasks = await getTodoSubtasks();
  console.log(`📋 Found ${subtasks.length} todo subtasks`);

  if (subtasks.length === 0) {
    console.log('✅ No subtasks to schedule');
    return;
  }

  // 4. Ask AI which tasks to schedule today
  const prompt = `
You are a productivity assistant scheduling tasks for today.

Available free time slots today (24hr format):
${freeSlots.map(s => `- ${s.start}:00 to ${s.end}:00 (${s.end - s.start} hours free)`).join('\n')}

Todo subtasks:
${subtasks.map(t => `- "${t.name}" (project: ${t.project}, estimated: ${t.estimatedHours}hrs)`).join('\n')}

Select which tasks to schedule today based on available time. 
Prioritize tasks with smaller estimated hours first to maximize completion.
Assign each task a specific start and end time within the free slots.

Respond ONLY in this JSON format, no extra text:
[
  {
    "name": "task name exactly as given",
    "start": 9.5,
    "end": 10.5
  }
]
`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
  });

  let scheduled = [];
  try {
    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    scheduled = JSON.parse(clean);
  } catch {
    console.error('Failed to parse schedule JSON');
    return;
  }

  // 5. Create time blocks in Notion Calendar
  const today = new Date();
  for (const item of scheduled) {
    await createTimeBlock({
      name: `🔨 ${item.name}`,
      task: item.name,
      startTime: hoursToTime(today, item.start),
      endTime: hoursToTime(today, item.end),
    });
  }

  console.log(`\n✅ Scheduled ${scheduled.length} tasks in Notion Calendar!`);
}