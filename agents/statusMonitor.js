import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import { getTodoSubtasks, updateSubtaskStatus } from '../notion/subtasks.js';

const octokit = new Octokit({ auth: config.github.token });

async function isIssueActuallyDone(issueUrl) {
  if (!issueUrl) return false;

  try {
    // Parse owner, repo, issue number from URL
    // e.g. https://github.com/owner/repo/issues/123
    const match = issueUrl.match(/github\.com\/(.+?)\/(.+?)\/(issues|pull)\/(\d+)/);
    if (!match) return false;

    const [, owner, repo, type, number] = match;

    if (type === 'issues') {
      const { data } = await octokit.rest.issues.get({
        owner, repo, issue_number: parseInt(number)
      });
      return data.state === 'closed';
    }

    if (type === 'pull') {
      const { data } = await octokit.rest.pulls.get({
        owner, repo, pull_number: parseInt(number)
      });
      return data.state === 'closed' || data.merged;
    }
  } catch {
    return false;
  }

  return false;
}

async function isInProgress(issueUrl) {
  if (!issueUrl) return false;

  try {
    const match = issueUrl.match(/github\.com\/(.+?)\/(.+?)\/issues\/(\d+)/);
    if (!match) return false;

    const [, owner, repo, number] = match;

    // Check if any recent commits reference this issue
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner, repo, per_page: 10
    });

    return commits.some(c =>
      c.commit.message.toLowerCase().includes(`#${number}`) ||
      c.commit.message.toLowerCase().includes(`fix #${number}`) ||
      c.commit.message.toLowerCase().includes(`close #${number}`)
    );
  } catch {
    return false;
  }
}

export async function runStatusMonitor() {
  console.log('\n👁️ Running Status Monitor...\n');

  const subtasks = await getTodoSubtasks();
  console.log(`📋 Checking ${subtasks.length} subtasks...`);

  let updated = 0;

  for (const subtask of subtasks) {
    if (!subtask.githubIssueUrl) continue;

    // Check if actually done
    const done = await isIssueActuallyDone(subtask.githubIssueUrl);
    if (done && subtask.status !== 'Done') {
      await updateSubtaskStatus(subtask.id, 'Done');
      console.log(`✅ Marked done: ${subtask.name}`);
      updated++;
      continue;
    }

    // Check if in progress
    const inProgress = await isInProgress(subtask.githubIssueUrl);
    if (inProgress && subtask.status === 'Todo') {
      await updateSubtaskStatus(subtask.id, 'In Progress');
      console.log(`🔄 Marked in progress: ${subtask.name}`);
      updated++;
    }
  }

  console.log(`\n✅ Status Monitor complete! Updated ${updated} subtasks.`);
}