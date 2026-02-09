# Migrate shared state from Vercel Blob to Supabase

## Step 1 – Create the Supabase table

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select project **podium pulse**.
2. Go to **SQL Editor** and run:

```sql
create table app_state (
  id bigint primary key default 1,
  state_data jsonb not null default '{}',
  last_modified timestamptz default now()
);

-- Optional: allow only one row (id = 1)
create unique index app_state_single_row on app_state ((true));
```

- If the unique index fails (some Postgres versions), you can skip it; the app only uses the row with `id = 1`.
- Alternatively use **Table Editor** → **New table**:
  - Name: `app_state`
  - Columns: `id` (int8, primary key, default `1`), `state_data` (jsonb, not null, default `'{}'`), `last_modified` (timestamptz, default `now()`).

---

## Step 2 – Environment variables

### In Vercel

1. Vercel Dashboard → your project → **Settings** → **Environment Variables**.
2. Add (for **Production**, and optionally Preview/Development):

| Name               | Value                    | Environment  |
|--------------------|--------------------------|-------------|
| `SUPABASE_URL`     | your Supabase project URL | Production (etc.) |
| `SUPABASE_ANON_KEY`| your Supabase anon key   | Production (etc.) |

3. Save and redeploy so the new variables are used.

### Where to find them in Supabase

1. Supabase Dashboard → **Project Settings** (gear in sidebar).
2. Open **API**.
3. Copy:
   - **Project URL** → use as `SUPABASE_URL`.
   - **Project API keys** → **anon** **public** → use as `SUPABASE_ANON_KEY`.

---

## Step 3 – Supabase permissions (if needed)

The anon key uses Supabase’s default RLS. If you enable RLS on `app_state`:

1. **Table Editor** → `app_state` → enable RLS.
2. **SQL Editor** → add policies so the anon key can read/write the single row:

```sql
-- Allow anonymous read/write for the single app_state row (use only if RLS is enabled)
alter table app_state enable row level security;

create policy "Allow anon read app_state"
  on app_state for select
  to anon
  using (true);

create policy "Allow anon upsert app_state"
  on app_state for all
  to anon
  using (true)
  with check (true);
```

If RLS is **not** enabled (default for new tables), the anon key can access the table without policies.

---

## Step 4 – Test locally before redeploying

1. Install deps and run the app:

```bash
cd build-a-bot-hackathon
npm install
npm run build
```

2. Create a `.env` or `.env.local` in the project root (same folder as `package.json`) with:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Run the Vercel dev server (so `api/state.js` is hit):

```bash
npx vercel dev
```

4. In another terminal (or browser DevTools → Console on the app page):

```bash
# GET state (should return default or existing state with lastModified)
curl -s http://localhost:3000/api/state | head -c 500

# POST state (should return {"ok":true})
curl -s -X POST http://localhost:3000/api/state \
  -H "Content-Type: application/json" \
  -d '{"teams":[],"slots":[{"id":"s1","name":"Slot 1"}],"timers":[],"settings":{},"questions":[],"quizState":{},"problemStatements":[]}'

# GET again (should return the state you just posted, with lastModified)
curl -s http://localhost:3000/api/state
```

5. In Supabase **Table Editor** → `app_state` you should see one row with `id = 1`, `state_data` (JSON), and `last_modified` updated.

After this works locally, push your code and redeploy on Vercel; the same env vars in the Vercel project will be used in production.
