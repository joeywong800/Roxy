-- FlixVault Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Watch history table
CREATE TABLE IF NOT EXISTS watch_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    tmdb_id INTEGER NOT NULL,
    title VARCHAR(255),
    poster_path VARCHAR(255),
    season INTEGER,
    episode INTEGER,
    timestamp FLOAT,
    duration FLOAT,
    progress FLOAT,
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_last_watched ON watch_history(last_watched DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_progress ON watch_history(user_id, progress);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    poster_path VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id, media_type)
);

-- Create indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites(added_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users table policies (service role only for backend access)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Watch history policies (service role only for backend access)
CREATE POLICY "Service role can manage watch history" ON watch_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Favorites policies (service role only for backend access)
CREATE POLICY "Service role can manage favorites" ON favorites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Optional: Add anon access for public reads (if needed)
-- CREATE POLICY "Enable read access for all users" ON users
--     FOR SELECT
--     TO anon
--     USING (true);
