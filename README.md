# Life OS

**A personal command center that connects Notion, GitHub, Gmail, and Google Calendar—with AI agents that run on a schedule.**

Built for [**The Notion AI Challenge**](https://events.mlh.io/events/13841-the-notion-ai-challenge) (MLH × Notion).

---

## What it does

Your work is scattered: code in repos, tasks in Notion, issues in GitHub, context in email and calendar. Life OS runs **scheduled agents** that pull everything into Notion and use AI to prioritize and plan:

| Agent | What it does |
|-------|----------------|
| **Repo Scanner** | Scans your GitHub repos (README, issues, file structure), uses AI to suggest subtasks, upserts **Projects** and **Subtasks** in Notion, and adds open PRs (from others) to a **PRs to review** database. |
| **Time Blocker** | Reads your todo subtasks and today’s Notion Calendar blocks, finds free slots (9AM–6PM), asks AI to suggest time blocks, and creates blocks in your **Notion Calendar** database. |
| **Morning Briefing** | Fetches recent Gmail, open GitHub items, and today’s Google Calendar events; asks AI to write a daily briefing (emails to action, GitHub focus, schedule, top 3 priorities) and writes it to a **Notion briefing page**. |
| **Status Monitor** | Runs every hour: checks if GitHub issues/PRs linked to Notion subtasks are closed or have recent commits, and updates subtask status in Notion. |

**Schedule (node-cron):**

- **On start** and **daily at 7AM** — Full run: Repo Scanner → Time Blocker → Morning Briefing.
- **Every hour** — Status Monitor.

---

## Tech stack

- **Node.js** (ES modules), **node-cron** for scheduling
- **Notion** — [@notionhq/client](https://github.com/makenotion/notion-sdk-js) for tasks, backlog, projects, subtasks, PRs, calendar, briefing
- **GitHub** — [@octokit/rest](https://github.com/octokit/rest.js) for repos, issues, PRs, commits
- **Gmail + Google Calendar** — [googleapis](https://github.com/googleapis/google-api-nodejs-client) with OAuth2 (shared `credentials.json` + `token.json`)
- **AI** — OpenAI-compatible API (e.g. [DeepSeek](https://www.deepseek.com/)) for briefing, subtask generation, and time-block suggestions

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/life-os.git
cd life-os
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# AI (e.g. DeepSeek)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Notion (create an integration at notion.so/my-integrations, then share each database with it)
NOTION_TOKEN=your_notion_integration_token
NOTION_TASKS_DB_ID=your_tasks_database_id
NOTION_BACKLOG_DB_ID=your_backlog_database_id
NOTION_BRIEFING_PAGE_ID=page_id_where_briefings_are_created
NOTION_PROJECTS_DB_ID=your_projects_database_id
NOTION_SUBTASKS_DB_ID=your_subtasks_database_id
NOTION_PRS_DB_ID=your_prs_to_review_database_id
NOTION_CALENDAR_DB_ID=your_calendar_database_id

# GitHub (Personal Access Token with repo + read:user)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
REPOS_TO_SCAN=owner/repo1,owner/repo2
```

- **Notion:** Create the databases (Tasks, Backlog, Projects, Subtasks, PRs, Calendar) and one parent page for briefings. Share each with your integration and paste IDs from the URLs.
- **GitHub:** [Create a PAT](https://github.com/settings/tokens) with `repo` and `read:user`. Set `REPOS_TO_SCAN` to the repos the Repo Scanner should process (comma-separated `owner/repo`).

### 3. Gmail + Google Calendar (optional)

Same OAuth flow for both (Gmail read + Calendar read):

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID (Desktop app).
3. Download the JSON and save as `credentials.json` in the project root.
4. On first run, the app will print a URL; authorize and paste the code. It saves `token.json` for future runs.

---

## Run

```bash
node index.js
```

- Runs the full agent cycle once (Repo Scanner → Time Blocker → Morning Briefing), then starts the cron jobs (7AM full run, hourly status monitor).
- Leave it running so the schedule applies; or run once and exit if you only want a single run.

---

## Project structure

```
life-os/
├── index.js              # Entry: run agents on start + cron (7AM full run, hourly status)
├── config.js             # Loads .env, exports config
├── agents/
│   ├── briefingAgent.js  # Gmail + GitHub + Calendar → AI → Notion briefing page
│   ├── repoScanner.js    # Scan REPOS_TO_SCAN → AI subtasks → Notion Projects/Subtasks/PRs
│   ├── timeBlocker.js    # Todo subtasks + calendar → free slots → AI → Notion Calendar blocks
│   └── statusMonitor.js  # Sync GitHub issue/PR state to Notion subtask status
├── notion/
│   ├── client.js         # Notion client
│   ├── tasks.js          # Create task, get open tasks
│   ├── backlog.js        # Add GitHub items to backlog
│   ├── projects.js       # Upsert project
│   ├── subtasks.js       # Create subtask, get todo subtasks, update status
│   ├── prs.js            # Add PR to review database
│   ├── notionCalendar.js # Get today's blocks, create time block
│   └── briefing.js       # Write daily briefing to Notion page
├── connectors/
│   ├── github.js         # Fetch GitHub issues/PRs
│   ├── gmail.js          # Fetch recent emails
│   └── calendar.js       # Fetch today's Google Calendar events
└── .env                  # Your secrets (not committed)
```

---

## The Notion AI Challenge

This project was built for [**The Notion AI Challenge**](https://events.mlh.io/events/13841-the-notion-ai-challenge) (March 2026), hosted by Major League Hacking and Notion.

- **Challenge:** Build an impressive system or process using Notion (e.g. [Notion MCP](https://mlh.link/notion-mcp))—so AI can use your context and run across the tools you use every day.
- **Life OS** uses the Notion API as the hub: tasks, backlog, projects, subtasks, PRs, calendar, and daily briefings all live in Notion. Scheduled agents pull from GitHub, Gmail, and Google Calendar and use AI to prioritize, suggest subtasks, block time, and write a daily briefing.

More info: [Notion AI Challenge landing page](https://mlh.link/notion) · [Submit your project](https://mlh.link/notion-submit)

---

## License

ISC
