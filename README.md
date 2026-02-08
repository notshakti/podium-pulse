# Build a Bot — Hackathon Website

A React app for running a **Build a Bot** hackathon with **slot-based teams**, **per-slot timers**, **Kahoot-style leaderboards** (overall + by slot), **quiz display**, and a **password-protected admin dashboard**. Data is stored in **localStorage** and syncs in near real-time across tabs.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Admin login:** Go to **Admin** (or `/admin`). You’ll be redirected to **Login**. Default password: **`admin123`**.

**Team registration:** Go to **Register** (or `/register`). Teams enter team name and team leader’s Gmail; they are auto-assigned to slots (Slot 1 → 2 → 3 in order, up to the max per slot set in Admin).

**Email server (optional):** To send problem statements by email, run the backend and set Gmail env vars (see below).

---

## Features

### Team registration (`/register`)

- **Login with your team leader’s Gmail:** Teams register with team name and leader Gmail.
- **Auto slot assignment:** Teams are assigned to Slot 1, then Slot 2, then Slot 3 in order. Default **max 20 teams per slot** (configurable in Admin).
- Duplicate Gmail is rejected; full slots show a clear error.

### Admin dashboard (`/admin`)

- **Scores visibility:** Toggle to hide or show all team scores on public leaderboards (Scores visible / Scores hidden).
- **Team management (slot-based):**
  - Add teams with **team name** and **slot** (Slot 1, Slot 2, Slot 3).
  - Teams listed by slot; **+ / −** and numeric input to adjust points.
  - **Delete** team with confirmation: *“Are you sure you want to delete [Team Name]? This action cannot be undone.”* (Cancel / Delete).
- **Per-slot timer (1h 30m):**
  - **Start timer** for a slot → 90-minute countdown (HH:MM:SS).
  - **Pause / Resume** and **Reset** (resets to 90 min and pauses).
- **Max teams per slot:** Set the maximum teams per slot (default 20) used when teams register via `/register`.
- **Problem statements:**
  - Add problem statements (title + full text). Each can be assigned to **at most 3 teams**.
  - **Assign & send problem statements:** Randomly assigns one problem per team (teams must have registered with Gmail). Sends emails to each team leader’s Gmail with their assigned problem. If the email server is not running or not configured, you can **download assignments as CSV** and email manually.
- **Quiz management:**
  - Create questions: question text, 4 options (A–D), mark correct answer.
  - View, **edit**, and **delete** questions.
  - **Start quiz** (first question), **Reveal answer**, **Next question**, **Stop quiz**.

### Public leaderboard (`/`)

- **Overall:** All teams from all slots, ranked by points.
  - Top 3 on a **podium** (1st center, 2nd left, 3rd right) with team name, slot, and points.
  - Scrollable table: **Rank | Team Name | Slot | Points** for the rest.
- **By slot:** Switch between Slot 1, Slot 2, Slot 3.
  - Per-slot podium and table (Rank | Team Name | Points).
  - **Active timer** for that slot when running (HH:MM:SS).
- **Real-time** updates; **respects** admin “hide scores” (shows — when hidden).

### Quiz display (`/display`)

- Full-screen view when admin starts a question.
- **Question** and **4 options (A–D)**.
- **10-second countdown** with **progress bar**; then correct answer **revealed** (green, “Correct!”), incorrect options dimmed.
- Use on a projector; stays in sync with admin.

### Technical

- **React** + **TypeScript** + **Vite**; **React Router**.
- **Persistent storage:** teams (with optional leader Gmail), slots, timers, settings (hide scores, max teams per slot), quiz questions, quiz state, problem statements, admin auth.
- **Real-time sync** between admin and public views via context + localStorage polling (~400ms).
- **Simple admin auth:** password-only login (default `admin123`; set in `src/storage.ts`).

### Email server (sending problem statements)

1. In a **second terminal**, run: `npm run server` (starts the backend on port 3001).
2. Set environment variables for Gmail (e.g. in a `.env` file in the **project root**):
   - `GMAIL_USER`: your Gmail address
   - `GMAIL_APP_PASSWORD`: a [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your normal password)
   - **Restart the server** after creating or changing `.env` so it picks up the variables.
3. With the Vite dev server running (`npm run dev`), the app proxies `/api` to the backend. **Assign & send problem statements** (Admin) and **team registration** (Register page) both send emails via this backend. If the server is not running or not configured, the admin panel shows a message and a **Download assignments (CSV)** button so you can email manually.

### Problem statements (slot-wise)

In **Admin → Problem statements (slot-wise)** you can add problem statements **per slot** (e.g. 10 for Slot 1, 10 for Slot 2, 10 for Slot 3). When you click **Assign & send problem statements**, each team that has a leader Gmail gets **one random problem** from their slot’s list (at most 3 teams per statement). Emails are sent via Gmail with the problem title and content.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

The app is set up to run on [Vercel](https://vercel.com) with no code changes.

1. **Push your repo to GitHub** (if you haven’t already).

2. **Import the project on Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
   - Import the GitHub repo. Vercel will use the existing `vercel.json` (build command, output directory, and SPA rewrites).

3. **Set environment variables** (for email sending)
   - In the Vercel project: **Settings** → **Environment Variables**.
   - Add:
     - `GMAIL_USER` — your Gmail address
     - `GMAIL_APP_PASSWORD` — your [Gmail App Password](https://support.google.com/accounts/answer/185833)
   - Redeploy after adding or changing variables.

4. **Deploy**
   - Each push to the main branch triggers a deploy. Or use **Deploy** from the Vercel dashboard.

The site will behave the same as locally: the React app is served from the root, `/api/send-problem-statements` runs as a serverless function (so “Assign & send” and registration emails work when Gmail env vars are set), and all app data stays in the browser’s **localStorage** (per device).
