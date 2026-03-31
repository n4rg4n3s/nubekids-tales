# Phase 7 — Authentication: Walkthrough

## What Was Done

Implemented Supabase Auth + Google OAuth for NubeKids, adding a login gate for B2C users while preserving the existing B2B token-based anonymous flow.

### Files Created (8)

| File | Purpose |
|------|---------|
| [authService.ts](file:///D:/nubekids-tales/src/services/authService.ts) | Sign up, sign in (email + Google), sign out, profile fetch, state listener |
| [useAuth.ts](file:///D:/nubekids-tales/src/hooks/useAuth.ts) | React hook: reactive auth state with session listener |
| [AuthContext.tsx](file:///D:/nubekids-tales/src/context/AuthContext.tsx) | Context provider wrapping the app |
| [LoginPage.tsx](file:///D:/nubekids-tales/src/components/auth/LoginPage.tsx) | Login form (email + Google OAuth button) |
| [SignUpPage.tsx](file:///D:/nubekids-tales/src/components/auth/SignUpPage.tsx) | Registration form with confirmation screen |
| [AuthCallback.tsx](file:///D:/nubekids-tales/src/components/auth/AuthCallback.tsx) | OAuth redirect loading screen |
| [001_profiles_and_trigger.sql](file:///D:/nubekids-tales/supabase/migrations/001_profiles_and_trigger.sql) | SQL: profiles table, RLS, auto-create trigger |

### Files Modified (3)

| File | Changes |
|------|---------|
| [types.ts](file:///D:/nubekids-tales/src/types.ts) | Added [UserRole](file:///D:/nubekids-tales/src/types.ts#221-222) type and [UserProfile](file:///D:/nubekids-tales/src/types.ts#223-230) interface |
| [App.tsx](file:///D:/nubekids-tales/src/App.tsx) | Added `'auth'` state, auth gating, B2B bypass, OAuth callback, user menu |
| [main.tsx](file:///D:/nubekids-tales/src/main.tsx) | Wrapped `<App />` with `<AuthProvider>` |

## Architecture Decisions

- **No React Router** — The existing state machine gains `'auth'` and `'auth-callback'` states, keeping the SPA architecture simple
- **B2B token bypass** — If `?token=xxx` is in the URL, auth is skipped entirely (anonymous session)
- **Nullable supabase client** — All auth functions handle `supabase === null` gracefully for local dev without env vars

## Verification

- ✅ `npx tsc --noEmit` — zero errors
- ⏳ Manual smoke test (user needs to reload the app)

## Manual Steps Required

> [!IMPORTANT]
> ### 1. Run the SQL migration
> Open **Supabase Dashboard → SQL Editor** and paste the contents of [supabase/migrations/001_profiles_and_trigger.sql](file:///D:/nubekids-tales/supabase/migrations/001_profiles_and_trigger.sql)

> [!IMPORTANT]
> ### 2. Configure Google OAuth (when ready)
> 1. **Google Cloud Console** → APIs & Services → Credentials → Create OAuth 2.0 Client ID
>    - Application type: Web application
>    - Authorized redirect URI: `https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback`
> 2. **Supabase Dashboard** → Authentication → Providers → Google
>    - Enable & paste Client ID + Client Secret
