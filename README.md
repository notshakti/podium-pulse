# Build a Bot — Hackathon Website

A single-page React app for running a **Build a Bot** hackathon with a **Kahoot-style** leaderboard, quiz display, and admin controls. Data is stored in **localStorage** and updates in near real-time across tabs.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

### 1. Leaderboard (`/`)

- **Podium** for top 3: 1st (center, highest), 2nd (left), 3rd (right) with names and points
- **Scrollable table** of all other participants ranked by points
- Animated, colorful layout; updates when data changes (e.g. from Admin)

### 2. Quiz display (`/display`)

- **Presentation view** for the current question and 4 multiple-choice options (A–D)
- **10-second countdown**; after 10 seconds the correct answer is revealed (green highlight)
- Use this URL on a projector or second screen; it stays in sync with Admin via shared state

### 3. Admin panel (`/admin`)

- **Quiz control**: Start quiz (first question), **Reveal answer**, **Next question**, **Stop quiz**
- **Quiz questions**: Add questions with 4 options and mark the correct one; delete questions
- **Participants & scores**: Add participants and **manually edit** each participant’s score

## Tips

- Open **Admin** in one tab and **Quiz display** (`/display`) in another (or on a projector) so the big screen shows the current question and countdown.
- Leaderboard and display **refresh automatically** as you change data in Admin (polling ~500ms).
- All data (questions, participants, scores, quiz state) is stored in **localStorage** and persists across reloads.

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** for `/`, `/admin`, `/display`
- **Context + localStorage** for state and persistence

## Build

```bash
npm run build
npm run preview   # preview production build
```
