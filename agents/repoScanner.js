import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import { upsertProject } from '../notion/projects.js';
import { createSubtask } from '../notion/subtasks.js';
import { addPRToReview } from '../notion/prs.js';

const deepseek = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: 'https://api.deepseek.com',
});

const octokit = new Octokit({ auth: config.github.token });

async function fetchRepoContext(owner, repo) {
  let readme = '';
  let issues = [];
  let fileStructure = [];

  // Fetch README
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    readme = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000);
  } catch {
    readme = 'No README found.';
  }

  // Fetch open issues
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner, repo, state: 'open', per_page: 10
    });
    issues = data
      .filter(i => !i.pull_request)
      .map(i => ({ title: i.title, url: i.html_url, number: i.number }));
  } catch {
    issues = [];
  }

  // Fetch file structure (root level)
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: '' });
    fileStructure = data.map(f => f.name);
  } catch {
    fileStructure = [];
  }

  return { readme, issues, fileStructure };
}

async function fetchCollaboratorPRs(owner, repo) {
  try {
    const { data } = await octokit.rest.pulls.list({
      owner, repo, state: 'open', per_page: 10
    });

    // Only PRs NOT made by you
    return data
      .filter(pr => pr.user.login !== config.github.username)
      .map(pr => ({
        title: pr.title,
        author: pr.user.login,
        url: pr.html_url,
        repo: `${owner}/${repo}`,
      }));
  } catch {
    return [];
  }
}

async function generateSubtasks(repoName, readme, issues, fileStructure) {
  const prompt = `
You are a senior software engineer analyzing a GitHub repository.

Repository: ${repoName}
File structure: ${fileStructure.join(', ')}

README:
${readme}

Open Issues:
${issues.map(i => `- ${i.title}`).join('\n') || 'None'}

Based on this context, generate 3-5 actionable development subtasks.
For each subtask provide:
- A clear, specific task name
- Estimated hours to complete (be realistic: 0.5, 1, 2, 3, or 4)
- Link to relevant GitHub issue if applicable

Respond ONLY in this JSON format, no extra text:
[
  {
    "name": "task name here",
    "estimatedHours": 1,
    "githubIssueUrl": "url or null"
  }
]
`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
  });

  try {
    const text = response.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    console.error('Failed to parse subtasks JSON');
    return [];
  }
}

export async function runRepoScanner() {
  console.log('\n🔍 Running Repo Scanner...\n');

  for (const fullRepo of config.github.reposToScan) {
    const [owner, repo] = fullRepo.split('/');
    console.log(`\n📦 Scanning: ${fullRepo}`);

    // 1. Fetch repo context
    const { readme, issues, fileStructure } = await fetchRepoContext(owner, repo);

    // 2. Get repo description
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });

    // 3. Upsert project in Notion
    await upsertProject({
      name: repo,
      repo: fullRepo,
      description: repoData.description || '',
    });

    // 4. Generate and save subtasks
    console.log(`🤖 Generating subtasks for ${repo}...`);
    const subtasks = await generateSubtasks(repo, readme, issues, fileStructure);

    for (const subtask of subtasks) {
      await createSubtask({
        name: subtask.name,
        project: fullRepo,
        estimatedHours: subtask.estimatedHours,
        githubIssueUrl: subtask.githubIssueUrl,
      });
    }

    // 5. Fetch and save collaborator PRs
    const prs = await fetchCollaboratorPRs(owner, repo);
    for (const pr of prs) {
      await addPRToReview(pr);
    }

    console.log(`✅ Done scanning: ${fullRepo}`);
  }

  console.log('\n✅ Repo Scanner complete!');
}