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

### 2. Run migration 02
Same place, paste `supabase-migration-02.sql` and Run. It adds the
`quiz_completed` flag, so profiles created before someone takes the quiz
aren't offered as matches.

### 3. Make the email send a 6-digit code, not a magic link
Supabase Dashboard → **Authentication** → **Email Templates** → **Magic
Link**. By default the template only contains `{{ .ConfirmationURL }}`,
which sends a clickable link. Add the token so the email carries a code:

```
Your Sur verification code is: {{ .Token }}
```

Without this change, people get a link instead of the 6-digit code the app
asks for.

### 4. Know the email rate limit
Supabase's built-in email service is for testing only and allows just a
couple of emails per hour on the free tier. For real users, connect your
own SMTP provider (Resend, SendGrid, Amazon SES) under **Project Settings
→ Authentication → SMTP Settings**. Until then, expect "too many codes
requested" during testing.

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
