# Supabase setup for OchemPath

1. Create a Supabase project at https://supabase.com/. Note your project URL and anon/service keys.

2. In the project dashboard, go to SQL Editor and run the SQL file `supabase/migrations/001_init.sql` to create tables.

3. Copy the keys into a local `.env.local` (do not commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Install dependencies locally and run the dev server:

```bash
npm install
npm run dev
```

5. Use the provided API endpoints:

- `GET /api/quizzes` — list quizzes
- `POST /api/quizzes` — create quiz (server)
- `GET /api/submissions` — list submissions
- `POST /api/submissions` — create a submission (server)

6. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use `supabaseAdmin` only from server routes.

7. Next steps: add RLS policies, seed data, and more API routes for grading, users, and progress metrics.
