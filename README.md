# ReviewPilot 🚀

ReviewPilot is an AI-powered reputation management agent that automatically monitors Google Business Profile and Yelp for new reviews, drafts personalized, on-brand responses, and flags negative reviews for urgent human attention—all without requiring business owners to log into multiple platforms. 

ReviewPilot ensures every customer review gets a high-quality reply within hours, saving local service businesses (dental clinics, auto repair shops, plumbers, HVAC companies, therapists, and law firms) hours of manual work per week.

---

## 🌟 Value Proposition & Target Customer

- **Target Customer**: Local service businesses who rely heavily on online reviews to build trust but are too busy doing their actual work to manually monitor and reply to reviews.
- **Auto-Response KPI**: Target of **>90% auto-response rate** with a **median response time under 4 hours**.
- **Pricing Plans**:
  - **Starter**: $9/mo (up to 50 reviews/mo) — *Google + Yelp monitoring, AI-drafted responses, alerts, weekly digest.*
  - **Growth**: $19/mo (up to 200 reviews/mo) — *Includes custom brand voice settings.*
  - **Pro**: $29/mo (unlimited reviews + multi-location support) — *Includes priority support.*

---

## 🛠️ System Architecture & Codebase

The repository is organized into isolated, specialized services:

```
├── site/                     # TanStack Start (React + Vite + Tailwind) Web Application
├── review-engine/            # AI Response Generator (OpenAI & Anthropic/Claude API integrations)
├── email-engine/             # Transactional email alert system using Resend templates
├── polling-service/          # Scheduled review aggregator for Google Business Profile & Yelp
├── redundant_files/          # Archive folder containing redundant/stale files
└── schema.sql                # SQLite Database Schema
```

### 1. Web Application (`site/`)
A full-stack React framework built using [TanStack Start](https://tanstack.com/start) running on **port 3000**.
- **Authenticated Dashboard**: Exposes a real-time review manager.
- **Review List (`/dashboard/reviews`)**: Real reviews from the active database. Users can edit drafts, **Approve & post**, or **Reject** drafts.
- **Settings (`/dashboard/settings`)**: Configure business details, brand voice tone (professional, warm, casual, family-oriented, formal), signature style, and custom instructions for the AI engine.

### 2. AI Response Engine (`review-engine/`)
Generates context-aware, on-brand responses by prompting OpenAI GPT or Anthropic Claude.
- Classifies incoming review sentiment (positive, neutral, negative).
- Generates careful draft replies keeping tone and custom business rules in mind.

### 3. Email Engine (`email-engine/`)
Transactional email notification systems powered by the **Resend SDK**.
- **Immediate Negative Alert**: Dispatched within minutes for 1-2 star reviews, containing the review details and CTA buttons to Approve or Edit.
- **Daily Digest**: Summarizes reviews accumulated during the day.
- **Weekly Reputation Summary**: Pre-renders a chart breakdown of ratings, response rates, and recent feedback.

### 4. Scheduled Polling Service (`polling-service/`)
A scheduled review importer pulling from platforms:
- **Google Business Profile**: Polls Google's location review endpoints and handles OAuth token refreshes.
- **Yelp**: Polls Yelp Fusion reviews for connected business IDs.
- Automatically processes imports through the database, routes drafts to the AI engine, and flags negative sentiment.

---

## 🔌 Dual-Mode Database Fallback

To support immediate hosting and review showcases on static servers, ReviewPilot is equipped with a **Dual-Mode Database Layer**:

1. **Full-Stack Mode**: When hosted on a Node/Bun server, the app queries the SQLite database (`reviewpilot.db`) using the `team-db` CLI with a built-in fallback to Node 24's native `node:sqlite` (`DatabaseSync`).
2. **Static Mode (GitHub Pages)**: If the app detects it is hosted on a static URL (like `*.github.io`), it automatically redirects database queries, user authentication sessions, settings updates, and draft actions to browser **`localStorage`**, pre-seeding the client view with active reviews.

---

## 🚀 How to Run & Verify

### 1. Web App
Install dependencies and run the development server or build the application:
```bash
cd site
npm install
npm run dev          # Start local dev server (port 3000)
npm run build        # Build SSR production assets
npm run build:static # Pre-render and export fully static pages into dist/static/ (ready for GitHub Pages)
```

### 2. Polling Service
Test the importer using mock data generator:
```bash
cd polling-service
npm install
node demo.js         # Runs poller loop simulator (seeding, importing, AI drafting)
```

### 3. Email Engine
Verify templates and test scripts:
```bash
cd email-engine
npm install
npm test             # Executes 16 automated templates tests
npm run demo         # Pre-renders sample HTML emails in temporary folder
```

---

## 🛠️ Actions Taken for Cleanup & Local Portability
- **Folder Clean Up**: Moved all redundant, outdated code and duplicate repositories under the dedicated `redundant_files/` folder to clean up the workspace.
- **SQLite fallback**: Created a `DatabaseSync` fallback wrapper that reads the `schema.sql` file and initializes SQLite databases natively without requiring global external binary installations on Windows development hosts.
- **GitHub Pages SSG script**: Created [build-static.js](file:///c:/RITvik/Projects/Review-Pilot/site/build-static.js) which compiles Vite components and automatically crawls SSR output pages, outputting static HTML pages and generating a SPA `404.html` fallback.