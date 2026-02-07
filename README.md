# Build a Bot — Hackathon Website

A React app for running a **Build a Bot** hackathon with **slot-based teams**, **per-slot timers**, **Kahoot-style leaderboards** (overall + by slot), **quiz display**, and a **password-protected admin dashboard**. Data is stored in **localStorage** and syncs in near real-time across tabs.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Admin login:** Go to **Admin** (or `/admin`). You’ll be redirected to **Login**. Default password: **`admin123`**.

---

## Features

### Admin dashboard (`/admin`)

- **Scores visibility:** Toggle to hide or show all team scores on public leaderboards (Scores visible / Scores hidden).
- **Team management (slot-based):**
  - Add teams with **team name** and **slot** (Slot 1, Slot 2, Slot 3).
  - Teams listed by slot; **+ / −** and numeric input to adjust points.
  - **Delete** team with confirmation: *“Are you sure you want to delete [Team Name]? This action cannot be undone.”* (Cancel / Delete).
- **Per-slot timer (1h 30m):**
  - **Start timer** for a slot → 90-minute countdown (HH:MM:SS).
  - **Pause / Resume** and **Reset** (resets to 90 min and pauses).
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
- **Persistent storage:** teams, slots, timers, settings (hide scores), quiz questions, quiz state, admin auth.
- **Real-time sync** between admin and public views via context + localStorage polling (~400ms).
- **Simple admin auth:** password-only login (default `admin123`; set in `src/storage.ts`).

## Build

```bash
npm run build
npm run preview
```
