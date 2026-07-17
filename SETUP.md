# MaintainIQ — Database Setup

MaintainIQ is an Inventory Management System with QR Tracking & Reporting.

## Step 1: Apply the database schema

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard/project/ofwdzvmgzmxnhswhhtut
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the entire contents of `supabase/migrations/20260717230000_assettrack_schema_fix.sql`
5. Paste it into the SQL editor and click **"Run"**

This creates all tables (profiles, assets, tickets, notifications), RLS policies, triggers, and seeds 5 sample assets.

## Step 2: Start the app

```
bun run dev
```

Or use the Replit workflow button.

## Phase 1 Checklist (confirm before Phase 2)
- [ ] Sign up as Reporter (Student) → redirected to `/dashboard/student`
- [ ] Sign up as Technician → redirected to `/dashboard/technician`
- [ ] Sign up as Administrator → redirected to `/dashboard/admin`
- [ ] Login/logout works
- [ ] Nav links between Assets, Tickets, Overview work for admin

## ⚠️ Production Note
Admin role is self-assignable at signup (demo only). Before production:
- Remove 'Administrator' from the signup role selector
- Grant admin role only via a secure superadmin route
