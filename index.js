import cron from 'node-cron';
import { runMorningBriefing } from './agents/briefingAgent.js';
import { runRepoScanner } from './agents/repoScanner.js';
import { runTimeBlocker } from './agents/timeBlocker.js';
import { runStatusMonitor } from './agents/statusMonitor.js';

console.log('🚀 Life OS started!\n');

async function runAll() {
  await runRepoScanner();       // Scan repos, generate subtasks
  await runTimeBlocker();       // Block time in Notion Calendar
  await runMorningBriefing();   // Generate daily briefing
}

// Run immediately on start
runAll();

// Schedule daily at 7AM
cron.schedule('0 7 * * *', () => {
  console.log('⏰ 7AM — Running full Life OS...');
  runAll();
});

// Check status every hour
cron.schedule('0 * * * *', () => {
  console.log('🔄 Hourly status check...');
  runStatusMonitor();
});

console.log('⏰ Scheduled: Full run at 7AM, status check every hour');