# Phase 1 — Authentication & Role System — Checklist

## ✅ Completed Implementation

### Database Schema
- [x] `profiles` table created with RLS policies
- [x] Auto-trigger to create profile on auth.users insert
- [x] Role constraint (student, technician, admin)
- [x] RLS: Users can SELECT/UPDATE own profile
- [x] RLS: Admins can SELECT all profiles

### Frontend Setup
- [x] Supabase client initialization (`src/lib/supabase.ts`)
- [x] Auth helper functions (signup, login, logout, getProfile) (`src/lib/auth.ts`)
- [x] Zustand auth store for session state (`src/lib/auth-store.ts`)
- [x] Root layout with auth state subscription (`src/routes/__root.tsx`)

### Auth Pages
- [x] **Signup Page** (`/signup`) — full name, email, password, role selector
- [x] **Login Page** (`/login`) — email, password, forgot password link
- [x] **Forgot Password** (`/forgot-password`) — Supabase reset flow
- [x] **Landing Page** (`/`) — redirects to role dashboard if logged in, to login if not

### Role-Based Dashboards (Placeholder Stubs)
- [x] **Dashboard Layout** (`/dashboard`) — auth guard, logout button
- [x] **Student Dashboard** (`/dashboard/student`)
- [x] **Technician Dashboard** (`/dashboard/technician`)
- [x] **Admin Dashboard** (`/dashboard/admin`)

## ⚠️ Before Testing

1. **Create Supabase Project**
   - Go to https://supabase.com and create a new project
   - Wait for it to initialize

2. **Run Database Migration**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/001_init_auth.sql`
   - Paste and run it

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in:
     - `VITE_SUPABASE_URL` — from Supabase project settings
     - `VITE_SUPABASE_ANON_KEY` — from Supabase project settings (anon/public key)

4. **Install Dependencies (if not already done)**
   ```bash
   npm install
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📋 Phase 1 Done Criteria — Testing

- [ ] Navigate to `http://localhost:5173/signup`
- [ ] Create account with:
  - Full Name: "Test User"
  - Email: "test@example.com"
  - Password: "TestPassword123"
  - Role: "Student"
- [ ] Verify row appears in Supabase `profiles` table with correct role
- [ ] Redirected to `/dashboard/student` after signup
- [ ] Logout button works and redirects to login
- [ ] Can log back in with same credentials
- [ ] Try logging in with wrong password — error shown
- [ ] Try accessing `/dashboard/admin` as student — redirected to login
- [ ] Create second account as "Technician" — redirects to `/dashboard/technician`
- [ ] Create third account as "Admin" — redirects to `/dashboard/admin`
- [ ] Forgot password page sends reset email (check Supabase logs/test project mail)
- [ ] Session persists on page refresh

## 🚀 Next Steps (Phase 2)

Once all above criteria are confirmed, move to **Phase 2: User Roles, Dashboards & Core Ticket Flow**

- Create `assets`, `tickets`, `notifications` tables
- Implement RLS for each table
- Build core ticket lifecycle (student reports → admin assigns → technician resolves)
- Add role-specific views and data access

---

## Code Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client + types
│   ├── auth.ts              # Auth functions (signup, login, etc.)
│   └── auth-store.ts        # Zustand store for session state
├── routes/
│   ├── __root.tsx           # App shell with auth listener
│   ├── index.tsx            # Landing page (redirect logic)
│   ├── signup.tsx           # Sign up form
│   ├── login.tsx            # Login form
│   ├── forgot-password.tsx  # Forgot password form
│   └── dashboard/
│       ├── _layout.tsx      # Dashboard wrapper + role guard
│       ├── student/
│       │   └── index.tsx    # Student dashboard
│       ├── technician/
│       │   └── index.tsx    # Technician dashboard
│       └── admin/
│           └── index.tsx    # Admin dashboard
```

---

## Known Gaps (Flagged per PRD)

⚠️ **Self-assignable Admin Role**: Currently anyone can pick "Admin" at signup. This is acceptable for demo/hackathon builds but should never be used in production. For real deployment, implement:
- Email domain restrictions (only @company.edu / @company.com admins)
- Admin invite flow (existing admin invites new admins)
- Role change audit logging
