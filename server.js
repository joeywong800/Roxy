const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'movy_secret_key_change_this_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files

// Supabase Client (Backend needs SERVICE_ROLE key for RLS bypass)
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://wyykszhwbhlhedrorsmq.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5eWtzemh3YmhsaGVkcm9yc21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDU2NiwiZXhwIjoyMDc1MzM2NTY2fQ.AfghJvUrKhtdyf8f87FGLCz2TM8ICJeFfh0yPhUtG7k'
);

// Health Check Endpoint (for offline detection)
app.get('/api/health', async (req, res) => {
    try {
        // Try to ping Supabase database
        const { error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
            return res.status(503).json({ 
                status: 'offline', 
                database: 'error',
                message: 'Database connection failed' 
            });
        }
        
        res.json({ 
            status: 'online', 
            database: 'connected',
            message: 'Server and database are healthy' 
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'offline', 
            database: 'error',
            message: error.message 
        });
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// User Registration
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if email already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email, password: hashedPassword }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ id: data.id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'User registered successfully',
            token,
            user: { id: data.id, name: data.name, email: data.email }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save Watch Progress
app.post('/api/watch-history', authenticateToken, async (req, res) => {
    const { content_id, media_type, tmdb_id, title, poster_path, season, episode, timestamp, duration, progress } = req.body;

    try {
        // Check if record exists
        const { data: existing } = await supabase
            .from('watch_history')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('content_id', content_id)
            .single();

        if (existing) {
            // Update existing record
            const { error } = await supabase
                .from('watch_history')
                .update({
                    timestamp,
                    duration,
                    progress,
                    last_watched: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) {
                console.error('Update error:', error);
                return res.status(500).json({ error: 'Database error' });
            }
        } else {
            // Insert new record
            const { error } = await supabase
                .from('watch_history')
                .insert([{
                    user_id: req.user.id,
                    content_id,
                    media_type,
                    tmdb_id,
                    title,
                    poster_path,
                    season,
                    episode,
                    timestamp,
                    duration,
                    progress
                }]);

            if (error) {
                console.error('Insert error:', error);
                return res.status(500).json({ error: 'Database error' });
            }
        }

        res.json({ message: 'Watch history saved' });
    } catch (error) {
        console.error('Watch history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Watch History
app.get('/api/watch-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('watch_history')
            .select('*')
            .eq('user_id', req.user.id)
            .lt('progress', 95)
            .order('last_watched', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Get watch history error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Watch history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add to Favorites
app.post('/api/favorites', authenticateToken, async (req, res) => {
    const { tmdb_id, media_type, title, poster_path } = req.body;

    try {
        // Check if already in favorites
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('tmdb_id', tmdb_id)
            .eq('media_type', media_type)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already in favorites' });
        }

        const { error } = await supabase
            .from('favorites')
            .insert([{
                user_id: req.user.id,
                tmdb_id,
                media_type,
                title,
                poster_path
            }]);

        if (error) {
            console.error('Favorites insert error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Added to favorites' });
    } catch (error) {
        console.error('Favorites error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Favorites
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', req.user.id)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Get favorites error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Favorites error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove from Favorites
app.delete('/api/favorites/:tmdb_id/:media_type', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', req.user.id)
            .eq('tmdb_id', req.params.tmdb_id)
            .eq('media_type', req.params.media_type);

        if (error) {
            console.error('Delete favorites error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Favorites error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`MOVY backend running on http://localhost:${PORT}`);
    console.log(`Using Supabase for database`);
});

