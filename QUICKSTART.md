# 🚀 FlixVault Quick Start Guide (Supabase Edition)

Get FlixVault running in just **5 minutes**!

## Step 1: Create Supabase Account (2 min)

1. Go to **[supabase.com](https://supabase.com)**
2. Click "Start your project" → Sign in with GitHub
3. Click "New Project"
4. Fill in:
   - Name: `FlixVault`
   - Database Password: (choose strong password)
   - Region: (closest to you)
5. Click "Create new project"
6. Wait 2-3 minutes ⏳

## Step 2: Set Up Database (1 min)

1. In Supabase dashboard → Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `database.sql` from FlixVault folder
4. Copy ALL the SQL code and paste it
5. Click **Run** (or Ctrl+Enter)
6. You should see "Success. No rows returned" ✅

## Step 3: Get Your Keys (30 sec)

1. In Supabase → Go to **Project Settings** (gear icon)
2. Click **API** in left sidebar
3. Copy these TWO values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

## Step 4: Configure Backend (1 min)

1. In FlixVault folder, copy `env.example` to `.env`:
   ```bash
   # On Windows PowerShell:
   Copy-Item env.example .env
   
   # On Mac/Linux:
   cp env.example .env
   ```

2. Open `.env` file and paste your keys:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-public-key-here
   JWT_SECRET=your-super-secret-random-string
   PORT=3000
   ```

3. Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and paste it as `JWT_SECRET` in `.env`

## Step 5: Start Everything (30 sec)

1. Install packages:
   ```bash
   npm install
   ```

2. Start backend:
   ```bash
   npm start
   ```

3. Open `index.html` in browser (or use Live Server in VS Code)

## ✅ You're Done!

Your FlixVault is now running with:
- ✅ Supabase cloud database
- ✅ User authentication
- ✅ Watch history sync
- ✅ Offline mode support
- ✅ Beautiful alerts

## 🎬 Try It Out

1. Click the **user icon** (top right)
2. Click "Sign Up"
3. Create your account
4. Start watching movies!

Your watch history will automatically sync to the cloud! 🚀

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check your `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Make sure you're using the **anon public** key, NOT service role key
- Verify your Supabase project is active

### "Port 3000 already in use"
- Change `PORT=3001` in `.env`
- Restart backend

### "Database tables not found"
- Go back to Supabase SQL Editor
- Re-run the `database.sql` script
- Check for any error messages

### Still having issues?
Check the detailed guide: [BACKEND_SETUP.md](BACKEND_SETUP.md)

---

## 📚 What's Next?

- Customize player colors in Settings ⚙️
- Add movies to favorites ⭐
- Share with friends (they get their own accounts!)
- Deploy to production (see BACKEND_SETUP.md)

Happy watching! 🍿

