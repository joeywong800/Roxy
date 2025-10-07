# 🔧 Fix: Cannot Create Account - Service Role Key Required

## Problem
Getting errors when trying to create an account after migrating to Supabase.

## Cause
The backend is using the **anon public** key, but the database has Row Level Security (RLS) that requires the **service_role** key for backend operations.

## Solution: Get Service Role Key

### Step 1: Get Your Service Role Key from Supabase

1. Go to your Supabase dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Select your **MOVY** project
3. Click **Project Settings** (gear icon in left sidebar)
4. Click **API** in the Configuration section
5. Scroll down to **Project API keys**
6. Find **service_role** key (⚠️ This is secret - don't share!)
7. Click **Reveal** and copy the long key

### Step 2: Update Your Server Configuration

**Option A: Using .env file (Recommended)**

1. Create/edit `.env` file in your project folder:
```env
SUPABASE_URL=https://wyykszhwbhlhedrorsmq.supabase.co
SUPABASE_SERVICE_KEY=paste-your-service-role-key-here
JWT_SECRET=your-jwt-secret
PORT=3000
```

**Option B: Directly in server.js (Quick test)**

Edit `server.js` line 20 and replace the key:
```javascript
const supabase = createClient(
    'https://wyykszhwbhlhedrorsmq.supabase.co',
    'YOUR_SERVICE_ROLE_KEY_HERE'  // Paste service_role key here
);
```

### Step 3: Restart Your Backend

Stop the server (Ctrl+C) and restart:
```bash
npm start
```

You should see:
```
MOVY backend running on http://localhost:3000
Using Supabase for database
```

### Step 4: Test Account Creation

1. Open your website
2. Click the user icon (top right)
3. Click "Sign Up"
4. Create a test account
5. Should see: ✅ "Welcome to MOVY" success alert!

## ⚠️ Security Warning

**NEVER** commit the service_role key to GitHub or share it publicly!

The service_role key has **full database access** and bypasses all security rules.

### Protect Your Keys:

1. Always use `.env` file (already in `.gitignore`)
2. Use environment variables in production
3. Only use service_role key on **backend server**
4. Never expose it to the **frontend**

## Why Service Role Key?

Your database has Row Level Security (RLS) policies that protect user data:

```sql
-- Only service_role can manage users
CREATE POLICY "Service role can manage users" ON users
    FOR ALL
    TO service_role
    USING (true);
```

This is **good security**! It means:
- ✅ Only your backend can create/modify users
- ✅ Frontend can't directly access database
- ✅ Users can't see other users' data
- ✅ All access goes through your authenticated API

## Still Having Issues?

### Check Browser Console (F12)
Look for errors like:
- "Database error"
- "Server error"
- "new row violates row-level security policy"

### Check Backend Console
You should see detailed error logs:
```
Supabase insert error: { message: '...' }
```

### Verify Database Tables Exist
1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see: `users`, `watch_history`, `favorites`
4. If not, run `database.sql` in SQL Editor

### Test Health Endpoint
Visit: http://localhost:3000/api/health

Should return:
```json
{
  "status": "online",
  "database": "connected",
  "message": "Server and database are healthy"
}
```

## 🎉 Success!

Once you've updated the service_role key and restarted the backend:
- ✅ Account creation works
- ✅ Login works
- ✅ Watch history syncs
- ✅ Offline mode still works
- ✅ Beautiful alerts show up

Happy watching! 🍿

