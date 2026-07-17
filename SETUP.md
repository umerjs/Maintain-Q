# AssetTrack — Database Setup

## Step 1: Apply the database schema

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard/project/ofwdzvmgzmxnhswhhtut
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the entire contents of `supabase/migrations/20260717230000_assettrack_schema_fix.sql`
5. Paste it into the SQL editor and click **"Run"**

This creates all tables (profiles, assets, tickets, notifications), sets up RLS policies, triggers, and seeds sample assets.

## Step 2: Start the app

The app runs with:
```
bun run dev
```

Or use the Replit workflow button.

## Phase 1 Checklist (confirm before Phase 2)
- [ ] Sign up as Student → redirected to `/dashboard/student`
- [ ] Sign up as Technician → redirected to `/dashboard/technician`
- [ ] Sign up as Admin → redirected to `/dashboard/admin`
- [ ] Login/logout works
- [ ] Wrong-role route blocked (student visiting `/dashboard/admin` redirects)

## ⚠️ Production Note
Admin role is self-assignable at signup (hackathon/demo only). Before production:
- Remove 'admin' from the signup role selector
- Restrict admin assignment to a superadmin API route
