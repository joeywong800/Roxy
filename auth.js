// Authentication Handler for MOVY

// Dynamic API URL - works locally and on GitHub Pages
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : null; // GitHub Pages - use offline mode

// Auth state
let currentUser = null;
let authToken = null;
let isOfflineMode = false;
let dbCheckInterval = null;

// Create offline account for GitHub Pages
function createOfflineAccount(name, email, password) {
    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('movy_offline_users') || '[]');
    if (existingUsers.find(user => user.email === email)) {
        showAlert('This email is already registered!', 'error', 'Email Already Used');
        return;
    }

    // Create offline user
    const offlineUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password, // In real app, hash this
        created_at: new Date().toISOString(),
        offline: true
    };

    // Save to localStorage
    existingUsers.push(offlineUser);
    localStorage.setItem('movy_offline_users', JSON.stringify(existingUsers));

    // Set current user
    currentUser = {
        id: offlineUser.id,
        name: offlineUser.name,
        email: offlineUser.email
    };
    authToken = 'offline_token_' + offlineUser.id;

    localStorage.setItem('movy_token', authToken);
    localStorage.setItem('movy_user', JSON.stringify(currentUser));

    updateUIForLoggedInUser();
    document.getElementById('authModal').classList.remove('active');
    showAlert('Account created successfully! (Offline mode)', 'success', 'Welcome to MOVY');
}

// Login offline account for GitHub Pages
function loginOfflineAccount(email, password) {
    const offlineUsers = JSON.parse(localStorage.getItem('movy_offline_users') || '[]');
    const user = offlineUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        authToken = 'offline_token_' + user.id;
        
        localStorage.setItem('movy_token', authToken);
        localStorage.setItem('movy_user', JSON.stringify(currentUser));
        
        updateUIForLoggedInUser();
        document.getElementById('authModal').classList.remove('active');
        return true;
    }
    return false;
}

// Custom Alert Function (SweetAlert Style)
function showAlert(message, type = 'info', title = '') {
    const overlay = document.getElementById('customAlert');
    const icon = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const btn = document.getElementById('alertBtn');
    
    // Set icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const titles = {
        success: title || 'Success!',
        error: title || 'Error!',
        warning: title || 'Warning!',
        info: title || 'Info'
    };
    
    icon.textContent = icons[type] || icons.info;
    icon.className = `alert-icon ${type}`;
    titleEl.textContent = titles[type];
    messageEl.textContent = message;
    
    overlay.classList.add('active');
    
    // Close on button click
    btn.onclick = () => {
        overlay.classList.remove('active');
    };
    
    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    };
}

// Load saved auth on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedAuth();
    setupAuthListeners();
    // Don't check immediately to avoid console spam - will check after 2 minutes
    startSyncCheck();
});

function loadSavedAuth() {
    authToken = localStorage.getItem('movy_token');
    const savedUser = localStorage.getItem('movy_user');
    
    if (authToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

function setupAuthListeners() {
    const authModal = document.getElementById('authModal');
    const closeAuth = document.getElementById('closeAuth');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginFormSubmit = document.getElementById('loginFormSubmit');
    const signupFormSubmit = document.getElementById('signupFormSubmit');

    loginBtn?.addEventListener('click', () => {
        authModal.classList.add('active');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    });

    closeAuth?.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    });

    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });

    loginFormSubmit?.addEventListener('submit', handleLogin);
    signupFormSubmit?.addEventListener('submit', handleSignup);
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Hero logout button
    const heroLogoutBtn = document.getElementById('heroLogoutBtn');
    heroLogoutBtn?.addEventListener('click', handleLogout);
    
    // Hero login button
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    heroLoginBtn?.addEventListener('click', () => {
        authModal.classList.add('active');
        // Show login form by default
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check if we're on GitHub Pages (no backend available)
    if (!API_URL) {
        // Use offline mode for GitHub Pages
        if (loginOfflineAccount(email, password)) {
            showAlert('Logged in successfully! (Offline mode)', 'success', 'Welcome Back');
        } else {
            showAlert('Invalid email or password', 'error', 'Login Failed');
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || 'Invalid email or password', 'error', 'Login Failed');
            return;
        }

        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('movy_token', authToken);
        localStorage.setItem('movy_user', JSON.stringify(currentUser));

        updateUIForLoggedInUser();
        document.getElementById('authModal').classList.remove('active');
        showAlert('Welcome back, ' + currentUser.name + '!', 'success', 'Login Successful');

        // Sync watch history from server
        syncWatchHistoryFromServer();

    } catch (error) {
        console.error('Login error:', error);
        
        // Try offline login with pending accounts
        if (tryOfflineLogin(email, password)) {
            showAlert('Logged in offline. Account will sync when database is online.', 'warning', 'Offline Mode');
        } else {
            showAlert('Unable to connect to server. Please check your connection.', 'error', 'Connection Error');
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // Check for duplicate email in pending accounts first
    if (isEmailUsedInPending(email)) {
        showAlert('This email is already registered and pending sync to database.', 'warning', 'Email Already Used');
        return;
    }

    // Check if we're on GitHub Pages (no backend available)
    if (!API_URL) {
        // Use offline mode for GitHub Pages
        createOfflineAccount(name, email, password);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || 'Unable to create account', 'error', 'Signup Failed');
            return;
        }

        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('movy_token', authToken);
        localStorage.setItem('movy_user', JSON.stringify(currentUser));

        updateUIForLoggedInUser();
        document.getElementById('authModal').classList.remove('active');
        showAlert('Your account has been created successfully!', 'success', 'Welcome to MOVY');

    } catch (error) {
        console.error('Signup error:', error);
        
        // Database is offline - save account locally
        if (saveAccountOffline(name, email, password)) {
            showAlert('Database is offline. Your account has been saved locally and will sync automatically when the database is back online!', 'warning', 'Offline Account Created');
            
            // Log them in with offline account
            currentUser = { name, email };
            authToken = 'offline_' + Date.now();
            
            localStorage.setItem('flixvault_token', authToken);
            localStorage.setItem('flixvault_user', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            document.getElementById('authModal').classList.remove('active');
        } else {
            showAlert('Unable to create account. Please try again.', 'error', 'Signup Failed');
        }
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('movy_token');
    localStorage.removeItem('movy_user');
    
    updateUIForLoggedOutUser();
    showAlert('You have been logged out successfully.', 'info', 'Goodbye!');
}

// Check database status (silent mode to avoid console spam)
async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_URL}/health`, { 
            method: 'GET',
            signal: AbortSignal.timeout(2000),
            cache: 'no-store'
        });
        const wasOffline = isOfflineMode;
        isOfflineMode = !response.ok;
        
        // If just came back online, sync
        if (wasOffline && !isOfflineMode) {
            console.log('✓ Database back online!');
            syncPendingAccounts();
        }
        
        return response.ok;
    } catch (error) {
        // Silently handle offline mode - don't log errors
        isOfflineMode = true;
        return false;
    }
}

// Start periodic sync check (reduced frequency to minimize console errors)
function startSyncCheck() {
    if (dbCheckInterval) clearInterval(dbCheckInterval);
    
    // Only check every 2 minutes to reduce console spam when backend is offline
    dbCheckInterval = setInterval(async () => {
        await checkDatabaseStatus();
    }, 120000); // Check every 2 minutes instead of 30 seconds
}

// Save account offline (localStorage)
function saveAccountOffline(name, email, password) {
    try {
        const pendingAccounts = JSON.parse(localStorage.getItem('pending_accounts') || '[]');
        
        // Check for duplicate
        if (pendingAccounts.some(acc => acc.email === email)) {
            return false;
        }
        
        pendingAccounts.push({
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('pending_accounts', JSON.stringify(pendingAccounts));
        return true;
    } catch (error) {
        console.error('Error saving offline account:', error);
        return false;
    }
}

// Check if email is already used in pending accounts
function isEmailUsedInPending(email) {
    try {
        const pendingAccounts = JSON.parse(localStorage.getItem('pending_accounts') || '[]');
        return pendingAccounts.some(acc => acc.email === email);
    } catch (error) {
        return false;
    }
}

// Try offline login
function tryOfflineLogin(email, password) {
    try {
        const pendingAccounts = JSON.parse(localStorage.getItem('pending_accounts') || '[]');
        const account = pendingAccounts.find(acc => acc.email === email && acc.password === password);
        
        if (account) {
            currentUser = { name: account.name, email: account.email };
            authToken = 'offline_' + Date.now();
            
            localStorage.setItem('flixvault_token', authToken);
            localStorage.setItem('flixvault_user', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            document.getElementById('authModal').classList.remove('active');
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

// Sync pending accounts when database comes back
async function syncPendingAccounts() {
    try {
        const pendingAccounts = JSON.parse(localStorage.getItem('pending_accounts') || '[]');
        
        if (pendingAccounts.length === 0) return;
        
        console.log(`📤 Syncing ${pendingAccounts.length} pending account(s)...`);
        
        const synced = [];
        const failed = [];
        
        for (const account of pendingAccounts) {
            try {
                const response = await fetch(`${API_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: account.name,
                        email: account.email,
                        password: account.password
                    })
                });
                
                if (response.ok) {
                    synced.push(account.email);
                    console.log(`✓ Synced: ${account.email}`);
                } else {
                    const data = await response.json();
                    if (data.error && data.error.toLowerCase().includes('already')) {
                        // Email already in database
                        synced.push(account.email);
                        console.log(`✓ Already exists: ${account.email}`);
                    } else {
                        failed.push(account);
                    }
                }
            } catch (error) {
                failed.push(account);
            }
        }
        
        // Update pending list (keep only failed ones)
        localStorage.setItem('pending_accounts', JSON.stringify(failed));
        
        if (synced.length > 0) {
            showAlert(`Successfully synced ${synced.length} account(s) to the database!`, 'success', 'Sync Complete');
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

function updateUIForLoggedInUser() {
    // Update header user dropdown
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    
    // Update hero user dropdown
    const heroUserName = document.getElementById('heroUserName');
    const heroUserEmail = document.getElementById('heroUserEmail');
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroLogoutBtn = document.getElementById('heroLogoutBtn');
    
    if (heroUserName) heroUserName.textContent = currentUser.name;
    if (heroUserEmail) heroUserEmail.textContent = currentUser.email;
    if (heroLoginBtn) heroLoginBtn.style.display = 'none';
    if (heroLogoutBtn) heroLogoutBtn.style.display = 'flex';
    
    // Update mobile user menu
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    if (mobileUserName) mobileUserName.textContent = currentUser.name;
    if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email;
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
}

function updateUIForLoggedOutUser() {
    // Update header user dropdown
    document.getElementById('userName').textContent = 'Guest';
    document.getElementById('userEmail').textContent = 'Not logged in';
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'none';
    
    // Update hero user dropdown
    const heroUserName = document.getElementById('heroUserName');
    const heroUserEmail = document.getElementById('heroUserEmail');
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroLogoutBtn = document.getElementById('heroLogoutBtn');
    
    if (heroUserName) heroUserName.textContent = 'Guest';
    if (heroUserEmail) heroUserEmail.textContent = 'Not logged in';
    if (heroLoginBtn) heroLoginBtn.style.display = 'flex';
    if (heroLogoutBtn) heroLogoutBtn.style.display = 'none';
    
    // Update mobile user menu
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    if (mobileUserName) mobileUserName.textContent = 'Guest';
    if (mobileUserEmail) mobileUserEmail.textContent = 'Not logged in';
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
}

// Save watch progress to server
async function saveWatchProgressToServer(progressData) {
    if (!authToken) return;

    try {
        await fetch(`${API_URL}/watch-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(progressData)
        });
    } catch (error) {
        console.error('Failed to save watch history to server:', error);
    }
}

// Sync watch history from server
async function syncWatchHistoryFromServer() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_URL}/watch-history`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const serverHistory = await response.json();
            // Merge with local storage
            serverHistory.forEach(item => {
                const key = `vidking_progress_${item.content_id}`;
                localStorage.setItem(key, JSON.stringify({
                    timestamp: item.timestamp,
                    duration: item.duration,
                    progress: item.progress,
                    mediaType: item.media_type,
                    id: item.tmdb_id,
                    season: item.season,
                    episode: item.episode,
                    lastWatched: new Date(item.last_watched).getTime()
                }));
            });
            
            // Reload continue watching if on home page
            if (typeof loadContinueWatching === 'function') {
                loadContinueWatching();
            }
        }
    } catch (error) {
        console.error('Failed to sync watch history:', error);
    }
}

// Export for use in app.js
window.FlixAuth = {
    getCurrentUser: () => currentUser,
    getAuthToken: () => authToken,
    isLoggedIn: () => !!authToken,
    logout: handleLogout,
    saveWatchProgress: saveWatchProgressToServer,
    syncWatchHistory: syncWatchHistoryFromServer
};

