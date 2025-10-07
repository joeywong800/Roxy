# 🍿 Movy - Movie & TV Series Streaming Website

A modern, responsive web application for browsing and watching movies and TV series using the VidKing API for streaming and TMDB API for content data.

## Features

- 🎬 Browse trending and popular movies
- 📺 Browse trending and popular TV series
- 🔍 Search for movies and TV shows
- ▶️ Watch movies and TV episodes directly
- 🔄 **Continue Watching** - Netflix-style section for in-progress content
- 💾 **Watch Progress Tracking** - Automatically saves your progress
- ⏯️ **Resume Playback** - Pick up where you left off
- 📊 **Progress Indicators** - Visual progress bars on movie cards
- ⚙️ **Settings Panel** - Customize player colors and features
- 🎨 **8 Color Themes** - Netflix Red, YouTube Red, Twitch Purple, Discord Blue, and more
- ⏭️ Next episode button for TV shows
- 📺 Built-in episode selector for TV series
- 📱 Responsive design for all devices
- 🎨 Modern, Netflix-inspired UI

## Setup Instructions

### 1. Get TMDB API Key

1. Go to [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key

### 2. Configure the Application

Open `app.js` and replace `YOUR_TMDB_API_KEY` with your actual TMDB API key:

```javascript
const TMDB_API_KEY = 'your_actual_api_key_here';
```

### 3. Run the Application

Since this is a pure HTML/CSS/JavaScript application, you can run it in several ways:

#### Option 1: Direct File Opening
- Simply open `index.html` in your web browser

#### Option 2: Local Server (Recommended)
- Using Python:
  ```bash
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000`

- Using Node.js (with `http-server`):
  ```bash
  npx http-server
  ```

- Using VS Code Live Server extension:
  - Install "Live Server" extension
  - Right-click on `index.html` and select "Open with Live Server"

## How It Works

### APIs Used

1. **TMDB API** - Provides movie and TV show metadata:
   - Trending content
   - Popular content
   - Search functionality
   - Episode information
   - Posters and ratings

2. **VidKing API** - Provides streaming functionality:
   - Movies: `https://www.vidking.net/embed/movie/{tmdbId}`
   - TV Series: `https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}`

### Features Breakdown

- **Navigation**: Toggle between Movies and TV Series
- **Search**: Find specific movies or TV shows
- **Movie Playback**: Click any movie to start streaming
- **TV Series Playback**: 
  - Click a TV show to open the player
  - Select season and episode
  - Episodes load dynamically
  - Next episode button for easy binge-watching
  - Built-in episode selector in the player

- **Continue Watching**: 
  - Shows up to 6 most recently watched items
  - Displays progress percentage for each item
  - Click to resume from where you left off
  - Automatically updates as you watch
  - Disappears when section is empty

- **Settings Panel** (⚙️ button):
  - Choose from 8 predefined color themes
  - Toggle auto-play on/off
  - Enable/disable next episode button
  - Enable/disable episode selector
  - Clear all watch progress
  - Settings persist across sessions

### Advanced Features

#### Watch Progress Tracking
The app automatically tracks your watch progress using VidKing's event system:
- **Auto-save**: Progress is saved every few seconds and when you pause
- **Resume**: Click any movie/show to resume from where you left off
- **Visual indicators**: Red progress bars appear on movie cards
- **Auto-clear**: Progress is removed when you finish watching (95%+)
- **LocalStorage**: All progress is saved locally in your browser

#### Player Configuration
Located in `app.js`, you can customize:
```javascript
const PLAYER_CONFIG = {
    color: 'e50914',        // Custom color (hex without #)
    autoPlay: false,         // Auto-play on load
    nextEpisode: true,       // Show next episode button (TV)
    episodeSelector: true    // Enable episode menu (TV)
};
```

#### Events Tracked
The player sends real-time events:
- `play` - When video starts
- `pause` - When video pauses
- `timeupdate` - Continuous progress updates
- `seeked` - When user jumps to different time
- `ended` - When video completes

All events are logged to the browser console for debugging.

## File Structure

```
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── app.js          # Application logic and API integration
└── README.md       # Documentation
```

## Backend Features (Optional)

FlixVault includes a **Node.js backend** with **Supabase** (PostgreSQL) database for:

- 🔐 **User Authentication** - Secure login/signup with JWT tokens
- ☁️ **Cloud Sync** - Watch history syncs across all devices
- 👤 **User Profiles** - Personal accounts with email/password
- 💾 **Database Storage** - All data stored securely in Supabase
- 🔒 **Password Security** - Bcrypt hashing for passwords
- 📱 **Session Management** - 7-day JWT tokens
- 🌐 **Offline-First** - Create accounts even when database is offline
- 🔄 **Auto-Sync** - Pending accounts sync automatically when online
- 🚨 **Beautiful Alerts** - SweetAlert-style notifications for all actions

### Backend Setup

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed instructions on:
1. Creating a free Supabase account
2. Setting up the database tables
3. Configuring environment variables
4. Running the Node.js API

**Why Supabase?**
- ✅ No local database installation required
- ✅ Free tier with 500MB database
- ✅ Cloud-hosted PostgreSQL
- ✅ Built-in security (Row-level security)
- ✅ Auto-scaling and backups
- ✅ Global CDN for fast access

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Important Notes

- VidKing API is used for demonstration purposes. Make sure to comply with their terms of service.
- TMDB API has rate limits on the free tier (check their documentation)
- Some content may not be available on VidKing

## License

This project is for educational purposes only.

## Credits

- Movie/TV data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Streaming via [VidKing](https://www.vidking.net/)

