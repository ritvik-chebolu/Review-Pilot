# ReviewPilot Setup and Deployment Guide

Welcome to ReviewPilot! This document walks through setting up the application locally and deploying it to Render for production.

---

## 🛠️ Local Development Setup

### 1. Installation
Clone the repository and install dependencies in the `site` folder:
```bash
cd site
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in the root to `site/.env` and update values:
```bash
cp ../.env.example .env
```
- If you don't have a DeepSeek or OpenAI key, leave `DEEPSEEK_API_KEY` blank. ReviewPilot will automatically fall back to the built-in **Smart Template Engine** (zero cost).
- If you don't have a Resend key, leave `RESEND_API_KEY` blank. Review alerts will log to the server console instead.

### 3. Run Development Server
Start the frontend and backend local server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🚀 Deployment to Render (No-Cost Path)

ReviewPilot is fully compatible with Render's **Free Web Service** tier.

### 1. Create a Blueprint Instance on Render
1. Sign in to [Render](https://render.com).
2. Click **New** → **Blueprint**.
3. Connect your GitHub repository containing the ReviewPilot files.
4. Render will parse `render.yaml` automatically and configure the environment.

### 2. Complete Environment Variable Configuration
Provide the missing environment values in your Render dashboard:
- `APP_URL`: The public URL Render gives your web service (e.g. `https://review-pilot.onrender.com`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Your Google Business Profile OAuth keys.
- `RESEND_API_KEY`: Your Resend API key for email delivery.

### 3. Configure Scheduled Polling
To automatically poll for new reviews, set up the **GitHub Actions cron workflow** or use a free scheduling service (like UptimeRobot) to hit the `/api/poll` endpoint:
- **Method**: `POST`
- **URL**: `https://your-app-name.onrender.com/api/poll`
- **Body**: `{"secret": "your-poll-secret-configured-on-render"}`
- **Interval**: Every 30 minutes.
