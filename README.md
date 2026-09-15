# Sur — real app (Phase 0)

Static site, no build step. Frontend talks directly to Supabase (Postgres +
Auth + Realtime) using the public anon key in `config.js`. That key is safe
to be public as long as Row Level Security stays on for every table, which
`supabase-schema.sql` turns on.

## Two things only you can do, before this works

### 1. Run the schema
Supabase Dashboard → your project → **SQL Editor** → New query → paste the
entire contents of `supabase-schema.sql` → **Run**.

This creates `profiles`, `likes`, `matches`, `messages`, `calls`, turns on
Row Level Security and a policy per table, and switches on Realtime for the
four tables the app listens to live.

### 2. Turn on anonymous sign-ins
Supabase Dashboard → **Authentication** → **Sign In / Providers** →
**Anonymous Sign-Ins** → enable it.

The app gives every visitor a real Supabase auth identity without asking
for an email or password yet. It's a stopgap for this phase, not the final
plan — real email/Google sign-in is still on the roadmap, and Supabase
supports upgrading an anonymous session to a real account later without
losing the person's data.

Once both are done, reload the app and the "could not connect" toast goes
away.

## Running it locally

No build tooling needed. Any static file server works, for example:

```bash
python -m http.server 8766
```

Then open `http://localhost:8766/index.html`.

## Deploying to Netlify

Simplest path, no git or CLI required:

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** →
   **Deploy manually**.
2. Drag this whole folder onto the page.
3. Netlify gives you a live URL immediately.

To update later: repeat the same drag-and-drop with the changed folder, or
connect this folder to a GitHub repo and let Netlify auto-deploy on every
push, if you'd rather have that flow.

## What's real right now, and what's still simulated

- Real accounts (anonymous for now), real shared database, real two-person
  matching, real chat: **fully real**, backed by Supabase.
- The "why your agent chose them" note and the demo profiles' chat replies:
  **rule-based**, not AI-written yet. Wiring in real AI notes needs an
  Anthropic API key living in a server-side function (a Netlify Function),
  never in this frontend code, since it's a secret. Ask when you're ready
  for that piece.
- Voice and video calls: **ringing, accept/decline, connection state, mute,
  camera toggle, and duration are all real and synced live** between two
  browsers via the `calls` table. The audio and video streams themselves
  are still simulated — real media needs a signalling and TURN relay
  service on top of this, which is a separate piece of work.

## Files

- `index.html` — markup + styles.
- `app.js` — all application logic.
- `config.js` — the public Supabase URL and anon key. Safe to be public.
  Never put the service_role/secret key here or anywhere in this repo.
- `supabase-schema.sql` — run once in the Supabase SQL Editor.
