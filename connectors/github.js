import { Octokit } from '@octokit/rest';
import { config } from '../config.js';

const octokit = new Octokit({ auth: config.github.token });

export async function fetchGitHubItems() {
  console.log('🐙 Fetching GitHub items...');

  const items = [];

  // Fetch issues assigned to you
  const { data: assigned } = await octokit.rest.issues.list({
    filter: 'assigned',
    state: 'open',
    per_page: 20,
  });
  items.push(...assigned.map(item => ({
    title: item.title,
    url: item.html_url,
    repo: item.repository?.full_name || 'unknown',
    type: item.pull_request ? 'PR' : 'Issue',
  })));

  // Fetch issues YOU created
  const { data: created } = await octokit.rest.issues.list({
    filter: 'created',
    state: 'open',
    per_page: 20,
  });
  items.push(...created.map(item => ({
    title: item.title,
    url: item.html_url,
    repo: item.repository?.full_name || 'unknown',
    type: item.pull_request ? 'PR' : 'Issue',
  })));

  // Fetch your own repos and their open issues
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 10,
  });

  for (const repo of repos) {
    const { data: repoIssues } = await octokit.rest.issues.listForRepo({
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open',
      per_page: 5,
    });
    items.push(...repoIssues.map(item => ({
      title: item.title,
      url: item.html_url,
      repo: repo.full_name,
      type: item.pull_request ? 'PR' : 'Issue',
    })));
  }

  // Remove duplicates by URL
  const unique = [...new Map(items.map(i => [i.url, i])).values()];

  console.log(`✅ Found ${unique.length} open GitHub items`);
  return unique;
}