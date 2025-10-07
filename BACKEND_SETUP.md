# FlixVault Backend Setup Guide (Supabase)

## 🚀 Quick Start with Supabase

### Prerequisites
- Node.js (v14 or higher)
- Supabase account (free tier available)
- npm or yarn

## Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (or create account)
4. Click "New Project"
5. Fill in project details:
   - **Name**: FlixVault
   - **Database Password**: (choose a strong password)
   - **Region**: (closest to you)
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (under Project API)
   - **anon public** key (under Project API keys)

### Step 3: Set Up Database Tables

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the contents of `database.sql`
4. Click **Run** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` file with your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key-here
JWT_SECRET=your-secure-random-string
PORT=3000
```

3. Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Install Dependencies

```bash
npm install
```

This will install:
- **express** - Web framework
- **@supabase/supabase-js** - Supabase client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin support
- **body-parser** - Request parsing
- **dotenv** - Environment variables

### Step 6: Start the Backend Server

Development mode (auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on: **http://localhost:3000**

### Step 7: Open FlixVault

Open `index.html` in your browser (or use Live Server in VS Code)

The backend will automatically:
✅ Connect to Supabase
✅ Handle user registration/login
✅ Save watch history to cloud
✅ Sync data across devices

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/user/profile` - Get user profile (requires auth)

### System
- `GET /api/health` - Check server and database status

### Watch History
- `POST /api/watch-history` - Save watch progress (requires auth)
- `GET /api/watch-history` - Get user watch history (requires auth)

### Favorites
- `POST /api/favorites` - Add to favorites (requires auth)
- `GET /api/favorites` - Get user favorites (requires auth)
- `DELETE /api/favorites/:tmdb_id/:media_type` - Remove from favorites (requires auth)

## 🔐 Features

### User Authentication
✅ Secure password hashing with bcrypt  
✅ JWT token-based authentication  
✅ 7-day session duration  
✅ Email uniqueness validation  

### Watch History
✅ Automatic progress saving  
✅ Continue watching across devices  
✅ Cloud sync for logged-in users  
✅ Offline mode with local storage fallback  
✅ Auto-sync when database comes online  

### Offline-First Architecture
✅ Create accounts even when database is offline  
✅ Login with locally stored accounts  
✅ Auto-sync pending accounts when online  
✅ Duplicate email checking (local & remote)  

### Data Storage
✅ Supabase (PostgreSQL) for persistence  
✅ Row-level security (RLS)  
✅ User data isolation  
✅ Foreign key constraints  
✅ Automatic indexing for performance  

## 🛠️ Troubleshooting

### Port Already in Use
Change port in `.env`:
```env
PORT=3001
```

### Supabase Connection Error
1. Verify SUPABASE_URL and SUPABASE_KEY in `.env`
2. Check if your Supabase project is active
3. Ensure you're using the **anon public** key, not service role key
4. Check Supabase dashboard for any issues

### CORS Errors
Backend is configured for CORS. If issues persist, update `server.js`:
```javascript
app.use(cors({
    origin: 'http://localhost:5500' // Your frontend URL
}));
```

### Database Tables Not Created
1. Go to Supabase SQL Editor
2. Run the `database.sql` script manually
3. Check for any error messages
4. Verify your database password is correct

### Authentication Issues
1. Check `.env` file has correct values
2. Verify JWT_SECRET is set
3. Clear browser localStorage and try again
4. Check browser console for errors

## 📊 Database Structure

### users
- `id` (Primary Key) - Auto-incrementing
- `name` - User's full name
- `email` (Unique) - Login email
- `password` (Hashed) - Bcrypt hashed
- `created_at` - Timestamp

### watch_history
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `content_id` - Unique identifier
- `media_type` - 'movie' or 'tv'
- `tmdb_id` - TMDB ID
- `title` - Content title
- `poster_path` - Poster image URL
- `season`, `episode` - For TV shows
- `timestamp` - Current watch position (seconds)
- `duration` - Total duration (seconds)
- `progress` - Watch percentage
- `last_watched` - Last update timestamp

### favorites
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `tmdb_id` - TMDB ID
- `media_type` - 'movie' or 'tv'
- `title` - Content title
- `poster_path` - Poster image
- `added_at` - Timestamp

## 🔒 Security Features

### Row Level Security (RLS)
Supabase RLS is enabled on all tables to protect user data:
- Users can only access their own data
- Service role (backend) has full access
- Anonymous users have no direct access

### Password Security
- Bcrypt hashing with salt rounds (10)
- Passwords never stored in plain text
- Secure password comparison

### JWT Tokens
- 7-day expiration
- Signed with secure secret
- HttpOnly recommended for production

### Environment Variables
- Sensitive credentials in `.env` (gitignored)
- Never commit `.env` to version control
- Use environment-specific configs

## 🎯 Production Deployment

### Backend Deployment (Vercel/Railway/Render)
1. Deploy backend to your hosting service
2. Set environment variables in hosting dashboard
3. Update `API_URL` in `auth.js` to your backend URL

### Frontend Deployment (Vercel/Netlify/GitHub Pages)
1. Deploy frontend static files
2. Update CORS settings in `server.js` with your domain

### Supabase Production Settings
1. Enable email confirmations (optional)
2. Set up custom SMTP (optional)
3. Configure RLS policies
4. Enable database backups
5. Set up monitoring

### Security Checklist for Production
- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS on backend
- [ ] Configure CORS with specific origins
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Enable Supabase RLS policies
- [ ] Use service role key only on backend
- [ ] Never expose service role key to frontend

## 📝 Advantages of Supabase over MySQL

✅ **No Local Installation** - Cloud-hosted PostgreSQL  
✅ **Free Tier** - 500MB database, 2GB file storage  
✅ **Auto-scaling** - Handles traffic spikes  
✅ **Built-in Security** - Row-level security (RLS)  
✅ **Real-time** - WebSocket support (optional)  
✅ **Dashboard** - Visual database management  
✅ **Backups** - Automatic daily backups  
✅ **Global CDN** - Fast from anywhere  

## 🚀 Next Steps

1. Start backend: `npm start`
2. Open FlixVault in browser
3. Click user icon → Login
4. Create an account (works even offline!)
5. Watch movies and history syncs automatically!

## 📚 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
- [FlixVault GitHub](https://github.com/yourusername/flixvault)

Enjoy your FlixVault with Supabase backend! 🍿✨
