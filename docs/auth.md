# Auth & progress sync (Supabase + GitHub OAuth)

## What is implemented

- **Client + middleware session refresh** via `@supabase/ssr` (`lib/supabase/*`, root `middleware.ts`).
- **GitHub OAuth** sign-in button in the site header (`components/AuthButton.tsx`).
- **OAuth callback** at `/auth/callback` (exchanges `code` for a session cookie).
- **Anonymous progress** always in `localStorage` (`lib/progress.ts`, key `aifb-progress-v1`).
- **Logged-in sync** to Supabase tables `progress` and `quiz_attempts` (RLS: own rows only). New users get a `profiles` row via trigger.

Quiz **content** is static JSON under `content/quizzes/` — no DB required to take quizzes.

## One-time Supabase dashboard steps (needs Yingjun)

These cannot be finished from the app alone; they need GitHub OAuth App credentials.

### 1. Create a GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Application name: e.g. `AI for Beginners Site`.
3. Homepage URL:
   - Production: `https://ai-for-beginners-site.vercel.app`
4. Authorization callback URL (Supabase callback, **not** the Next.js route):

   ```
   https://miryyieqoiqlgfyzmmql.supabase.co/auth/v1/callback
   ```

5. Copy **Client ID** and generate a **Client Secret**.

### 2. Enable GitHub provider in Supabase

1. Supabase project `miryyieqoiqlgfyzmmql` (Tokyo / `ap-northeast-1`).
2. **Authentication → Providers → GitHub** → Enable.
3. Paste Client ID + Client Secret → Save.

### 3. Add redirect URLs

**Authentication → URL Configuration**:

| Setting | Value |
|--------|--------|
| Site URL | `https://ai-for-beginners-site.vercel.app` |
| Redirect URLs | `https://ai-for-beginners-site.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

### 4. Env vars

Already expected in `.env.local` / Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://miryyieqoiqlgfyzmmql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Optional (server-only, never expose to client):

```
SUPABASE_SERVICE_ROLE_KEY=<service role>
```

Do **not** commit `.env.local`.

### 5. Verify

1. Open the site → header shows **GitHub 登录 / Sign in with GitHub**.
2. Complete OAuth → redirected to `/auth/callback` then back.
3. Take a quiz while signed in → row appears in `quiz_attempts` and `progress`.
4. `/progress` shows local + cloud counts.

If the GitHub provider is not configured yet, the button still appears (when env keys exist) but OAuth will fail with a Supabase/GitHub error — see `auth=error` on `/progress`.

## Schema (applied)

- Migration `mvp_profiles_progress` — `profiles`, `progress` + RLS.
- Migration `mvp_quiz_attempts` — `quiz_attempts` + RLS + `handle_new_user` trigger.

SQL copies also live under `supabase/migrations/` for the repo.

## Local development

```bash
cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_*
npm run dev
```

Use `http://localhost:3000/auth/callback` as listed above.
