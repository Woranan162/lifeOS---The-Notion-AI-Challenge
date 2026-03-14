# Life OS

**A personal command center that connects Notion, GitHub, and Gmail—and uses AI to tell you what to focus on.**

Built for [**The Notion AI Challenge**](https://events.mlh.io/events/13841-the-notion-ai-challenge) (MLH × Notion).

---

## What it does

Your work is scattered: code in an editor, tasks in Notion, issues in GitHub, context in email. Life OS pulls it together and puts an AI in the loop:

- **Notion** — Tasks and feature backlog live here. Create tasks, query open items, and sync everything else into Notion.
- **GitHub** — Fetches your open issues and PRs (assigned, created, or from your repos) and adds them to a Notion backlog.
- **Gmail** — Fetches recent emails so you (or future agents) can use inbox context.
- **AI (DeepSeek)** — Given your open Notion tasks, summarizes them and suggests what to focus on first.

So: one place (Notion) for tasks and backlog, fed by GitHub and email, with an AI layer on top.

---

## Tech stack

- **Node.js** (ES modules)
- **Notion** — [@notionhq/client](https://github.com/makenotion/notion-sdk-js) for tasks and backlog databases
- **GitHub** — [@octokit/rest](https://github.com/octokit/rest.js) for issues and PRs
- **Gmail** — [Google APIs (googleapis)](https://github.com/googleapis/google-api-nodejs-client) with OAuth2
- **AI** — [OpenAI-compatible API](https://platform.openai.com/docs) (e.g. DeepSeek) for task summarization and prioritization

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

# Notion (create an integration at notion.so/my-integrations)
NOTION_TOKEN=your_notion_integration_token
NOTION_TASKS_DB_ID=your_tasks_database_id
NOTION_BACKLOG_DB_ID=your_backlog_database_id
NOTION_BRIEFING_PAGE_ID=optional_briefing_page_id

# GitHub (Personal Access Token with repo + read:user)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
```

- **Notion:** Create two databases (Tasks and Backlog), share them with your integration, and paste their IDs from the URL.
- **GitHub:** [Create a PAT](https://github.com/settings/tokens) with `repo` and `read:user`.

### 3. Gmail (optional)

For Gmail, you need OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID (Desktop app).
3. Download the JSON and save it as `credentials.json` in the project root.
4. On first run, the app will open a URL to authorize; after you sign in, it saves `token.json` for future runs.

---

## Run

```bash
node index.js
```

This will:

1. Test the Notion connection.
2. Create a sample task in your Notion Tasks database.
3. Fetch open tasks from Notion and call the AI to summarize and suggest focus.
4. Fetch your open GitHub issues/PRs and add them to your Notion Backlog.
5. (If configured) Fetch recent Gmail messages.

---

## Project structure

```
life-os/
├── index.js           # Entry: Notion + AI + GitHub + Gmail flow
├── config.js          # Loads .env and exports config
├── notion/
│   ├── client.js      # Notion client and connection test
│   ├── tasks.js       # Create task, get open tasks
│   └── backlog.js     # Add GitHub items to Notion backlog
├── connectors/
│   ├── github.js      # Fetch GitHub issues/PRs
│   └── gmail.js       # Gmail OAuth and fetch recent emails
└── .env               # Your secrets (not committed)
```

---

## The Notion AI Challenge

This project was built for [**The Notion AI Challenge**](https://events.mlh.io/events/13841-the-notion-ai-challenge) (March 2026), hosted by Major League Hacking and Notion.

- **Challenge:** Build an impressive system or process using Notion (e.g. [Notion MCP](https://mlh.link/notion-mcp))—so AI can use your context and run across the tools you use every day.
- **Life OS** uses the Notion API to make Notion the hub for tasks and backlog, then wires in GitHub, Gmail, and an AI to prioritize and summarize. One workflow so it feels like you have a single “operating system” for your work.

More info: [Notion AI Challenge landing page](https://mlh.link/notion) · [Submit your project](https://mlh.link/notion-submit)

---

## License

ISC
