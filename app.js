// Configuration
const TMDB_API_KEY = '9221f91f2ced18af85c11c9599690868'; // Get free API key from https://www.themoviedb.org/settings/api
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const VIDKING_BASE_URL = 'https://www.vidking.net';

// Player Configuration
const PLAYER_CONFIG = {
    color: 'e50914', // Netflix red
    autoPlay: false,
    nextEpisode: true,
    episodeSelector: true
};

// State
let currentType = 'movie';
let currentShow = null;
let currentSeason = 1;
let totalSeasons = 1;
let currentContentId = null;

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// DOM Elements (cached)
let navBtns, searchInput, searchToggle, searchOverlay, closeSearch, homeLink;
let featuredContent, popularContent, searchContent, searchResults;
let continueWatchingSection, continueWatchingContent, playerModal, videoPlayer;
let closePlayer, loading, settingsBtn, settingsModal, closeSettings;
let searchSuggestions, detailsModal, detailsContent, closeDetails;

// Initialize DOM elements after page loads
function initDOMElements() {
    navBtns = document.querySelectorAll('.dropdown-item');
    searchInput = document.getElementById('searchInput');
    searchToggle = document.getElementById('searchToggle');
    searchOverlay = document.getElementById('searchOverlay');
    closeSearch = document.getElementById('closeSearch');
    homeLink = document.getElementById('homeLink');
    searchSuggestions = document.getElementById('searchSuggestions');
    featuredContent = document.getElementById('featuredContent');
    popularContent = document.getElementById('popularContent');
    searchContent = document.getElementById('searchContent');
    searchResults = document.getElementById('searchResults');
    continueWatchingSection = document.getElementById('continueWatching');
    continueWatchingContent = document.getElementById('continueWatchingContent');
    detailsModal = document.getElementById('detailsModal');
    detailsContent = document.getElementById('detailsContent');
    closeDetails = document.getElementById('closeDetails');
    playerModal = document.getElementById('playerModal');
    videoPlayer = document.getElementById('videoPlayer');
    closePlayer = document.getElementById('closePlayer');
    loading = document.getElementById('loading');
    settingsBtn = document.getElementById('settingsBtn');
    settingsModal = document.getElementById('settingsModal');
    closeSettings = document.getElementById('closeSettings');
}

// Debounce utility for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event Listeners
function setupEventListeners() {
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
        loadContent();
    });
});

    // Genre filter
    const genreBtns = document.querySelectorAll('[data-genre]');
    genreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const genreId = btn.dataset.genre;
            const genreName = btn.textContent;
            loadGenreContent(genreId, genreName);
    });
});

// Search overlay
searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
    // Show trending content when opening search
    showSearchSuggestions();
});

closeSearch.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
});

searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
        }
    });

    // Close search on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
            searchSuggestions.classList.remove('active');
        }
    });

    // Live search suggestions
    const debouncedSuggestions = debounce(() => {
        showSearchSuggestions();
    }, 300);

    searchInput.addEventListener('input', () => {
        debouncedSuggestions();
    });

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
            e.preventDefault();
        performSearch();
            searchSuggestions.classList.remove('active');
        }
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!searchOverlay.contains(e.target)) {
            searchSuggestions.classList.remove('active');
    }
});

// Home link
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    searchResults.classList.add('hidden');
    loadContent();
});

closePlayer.addEventListener('click', closePlayerModal);
    closeDetails.addEventListener('click', () => detailsModal.classList.remove('active'));
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    loadSettings();
});
    
    // Desktop header user dropdown
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        const userDropdown = document.querySelector('header .user-dropdown');
        
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && e.target !== userBtn) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    // Hero navigation event listeners
    const heroHomeLink = document.getElementById('heroHomeLink');
    const heroSearchToggle = document.getElementById('heroSearchToggle');
    const heroSettingsBtn = document.getElementById('heroSettingsBtn');
    const heroUserBtn = document.getElementById('heroUserBtn');
    
    if (heroHomeLink) {
        heroHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            searchResults.classList.add('hidden');
            loadContent();
        });
    }
    
    if (heroSearchToggle) {
        heroSearchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            searchInput.focus();
            // Show trending content when opening search
            showSearchSuggestions();
        });
    }
    
    if (heroSettingsBtn) {
        heroSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
            loadSettings();
        });
    }
    
    if (heroUserBtn) {
        const heroUserDropdown = document.getElementById('heroUserDropdown');
        const heroLoginBtn = document.getElementById('heroLoginBtn');
        const heroLogoutBtn = document.getElementById('heroLogoutBtn');
        
        heroUserBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            heroUserDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!heroUserDropdown.contains(e.target) && e.target !== heroUserBtn) {
                heroUserDropdown.classList.remove('active');
            }
        });
        
        // Hero Login button
        if (heroLoginBtn) {
            heroLoginBtn.addEventListener('click', () => {
                heroUserDropdown.classList.remove('active');
                authModal.classList.add('active');
            });
        }
        
        // Hero Logout button
        if (heroLogoutBtn) {
            heroLogoutBtn.addEventListener('click', () => {
                heroUserDropdown.classList.remove('active');
                if (window.FlixAuth && typeof window.FlixAuth.logout === 'function') {
                    window.FlixAuth.logout();
                }
            });
        }
    }
closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));

    // Modal click outside handlers
    playerModal.addEventListener('click', (e) => {
        if (e.target === playerModal) {
            closePlayerModal();
        }
    });

    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.classList.remove('active');
        }
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
    
    // Mobile Bottom Navigation
    const mobileHomeBtn = document.getElementById('mobileHomeBtn');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileBrowseBtn = document.getElementById('mobileBrowseBtn');
    const mobileUserBtn = document.getElementById('mobileUserBtn');
    
    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
            // Remove active state from all mobile nav items
            document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
            mobileHomeBtn.classList.add('active');
            searchResults.classList.add('hidden');
            searchOverlay.classList.remove('active');
            loadContent();
        });
    }
    
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            // Remove active state from all mobile nav items
            document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
            mobileSearchBtn.classList.add('active');
            searchOverlay.classList.add('active');
            searchInput.focus();
            showSearchSuggestions();
        });
    }
    
    if (mobileBrowseBtn) {
        const mobileBrowseSheet = document.getElementById('mobileBrowseSheet');
        const mobileBrowseClose = document.getElementById('mobileBrowseClose');
        const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
        
        mobileBrowseBtn.addEventListener('click', () => {
            // Remove active state from all mobile nav items
            document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
            mobileBrowseBtn.classList.add('active');
            
            // Show mobile browse sheet and backdrop
            if (mobileBrowseSheet) {
                mobileBrowseSheet.classList.add('active');
                mobileBrowseBackdrop.classList.add('active');
            }
        });
        
        // Close mobile browse sheet
        if (mobileBrowseClose) {
            mobileBrowseClose.addEventListener('click', () => {
                mobileBrowseSheet.classList.remove('active');
                mobileBrowseBackdrop.classList.remove('active');
            });
        }
        
        // Close on backdrop click
        if (mobileBrowseBackdrop) {
            mobileBrowseBackdrop.addEventListener('click', () => {
                mobileBrowseSheet.classList.remove('active');
                mobileBrowseBackdrop.classList.remove('active');
            });
        }
        
        // Handle browse sheet button clicks
        const mobileBrowseBtns = document.querySelectorAll('.mobile-browse-btn');
        mobileBrowseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                mobileBrowseBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentType = btn.dataset.type;
                loadContent();
                mobileBrowseSheet.classList.remove('active');
                mobileBrowseBackdrop.classList.remove('active');
                // Update desktop nav too
                navBtns.forEach(b => b.classList.remove('active'));
                const desktopBtn = Array.from(navBtns).find(b => b.dataset.type === currentType);
                if (desktopBtn) desktopBtn.classList.add('active');
            });
        });
        
        // Handle genre button clicks
        const mobileGenreBtns = document.querySelectorAll('.mobile-genre-btn');
        mobileGenreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const genreId = btn.dataset.genre;
                const genreName = btn.textContent;
                loadGenreContent(genreId, genreName);
                mobileBrowseSheet.classList.remove('active');
                mobileBrowseBackdrop.classList.remove('active');
            });
        });
    }
    
    if (mobileUserBtn) {
        mobileUserBtn.addEventListener('click', () => {
            // Remove active state from all mobile nav items
            document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
            mobileUserBtn.classList.add('active');
            
            // Show mobile user sheet
            const mobileUserSheet = document.getElementById('mobileUserSheet');
            const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
            
            if (mobileUserSheet && mobileBrowseBackdrop) {
                mobileUserSheet.style.display = 'block';
                mobileBrowseBackdrop.classList.add('active');
                setTimeout(() => {
                    mobileUserSheet.classList.add('active');
                }, 10);
            }
        });
    }
    
    // Mobile user menu close button
    const mobileUserClose = document.getElementById('mobileUserClose');
    if (mobileUserClose) {
        mobileUserClose.addEventListener('click', () => {
            const mobileUserSheet = document.getElementById('mobileUserSheet');
            const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
            
            if (mobileUserSheet) {
                mobileUserSheet.classList.remove('active');
                setTimeout(() => {
                    mobileUserSheet.style.display = 'none';
                }, 400);
            }
            if (mobileBrowseBackdrop) {
                mobileBrowseBackdrop.classList.remove('active');
            }
        });
    }
    
    // Mobile login button
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            // Close mobile user sheet
            const mobileUserSheet = document.getElementById('mobileUserSheet');
            const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
            
            if (mobileUserSheet) {
                mobileUserSheet.classList.remove('active');
                setTimeout(() => {
                    mobileUserSheet.style.display = 'none';
                }, 400);
            }
            if (mobileBrowseBackdrop) {
                mobileBrowseBackdrop.classList.remove('active');
            }
            
            // Show auth modal
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.classList.add('active');
            }
        });
    }
    
    // Mobile logout button
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            // Call logout function from auth.js
            if (window.FlixAuth && typeof window.FlixAuth.logout === 'function') {
                window.FlixAuth.logout();
            }
            
            // Close mobile user sheet
            const mobileUserSheet = document.getElementById('mobileUserSheet');
            const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
            
            if (mobileUserSheet) {
                mobileUserSheet.classList.remove('active');
                setTimeout(() => {
                    mobileUserSheet.style.display = 'none';
                }, 400);
            }
            if (mobileBrowseBackdrop) {
                mobileBrowseBackdrop.classList.remove('active');
            }
        });
    }
    
    // Close mobile user sheet when backdrop is clicked
    const mobileBrowseBackdrop = document.getElementById('mobileBrowseBackdrop');
    if (mobileBrowseBackdrop) {
        mobileBrowseBackdrop.addEventListener('click', () => {
            const mobileUserSheet = document.getElementById('mobileUserSheet');
            const mobileBrowseSheet = document.getElementById('mobileBrowseSheet');
            
            if (mobileUserSheet && mobileUserSheet.classList.contains('active')) {
                mobileUserSheet.classList.remove('active');
                setTimeout(() => {
                    mobileUserSheet.style.display = 'none';
                }, 400);
            }
            
            if (mobileBrowseSheet && mobileBrowseSheet.classList.contains('active')) {
                mobileBrowseSheet.classList.remove('active');
                setTimeout(() => {
                    mobileBrowseSheet.style.display = 'none';
                }, 400);
            }
            
            mobileBrowseBackdrop.classList.remove('active');
        });
    }
    
    // Set home as active by default on mobile
    if (mobileHomeBtn) {
        mobileHomeBtn.classList.add('active');
    }
    
    // Make hero-nav logo clickable on mobile to go home
    const heroNavLogo = document.querySelector('.hero-nav .logo');
    if (heroNavLogo) {
        heroNavLogo.addEventListener('click', () => {
            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Activate home button
            document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
            if (mobileHomeBtn) {
                mobileHomeBtn.classList.add('active');
            }
            // Load home content
            searchResults.classList.add('hidden');
            searchOverlay.classList.remove('active');
            loadContent();
        });
    }
}

// Initialize settings event listeners
function setupSettingsListeners() {
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PLAYER_CONFIG.color = btn.dataset.color;
        saveSettings();
    });
});

document.getElementById('autoPlayToggle').addEventListener('change', (e) => {
    PLAYER_CONFIG.autoPlay = e.target.checked;
    saveSettings();
});

document.getElementById('nextEpisodeToggle').addEventListener('change', (e) => {
    PLAYER_CONFIG.nextEpisode = e.target.checked;
    saveSettings();
});

document.getElementById('episodeSelectorToggle').addEventListener('change', (e) => {
    PLAYER_CONFIG.episodeSelector = e.target.checked;
    saveSettings();
});

document.getElementById('clearProgressBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all watch progress? This cannot be undone.')) {
        clearAllProgress();
        alert('All watch progress has been cleared.');
        loadContinueWatching();
    }
});
}

// Player Loading Screen Functions
function showPlayerLoading(content) {
    const playerLoading = document.getElementById('playerLoading');
    const playerPoster = document.getElementById('playerPoster');
    const playerTitle = document.getElementById('playerTitle');
    
    if (playerLoading && playerPoster && playerTitle && content) {
        const posterPath = content.poster_path 
            ? `${TMDB_IMAGE_BASE}${content.poster_path}`
            : 'https://via.placeholder.com/300x450?text=Loading';
        
        const title = content.title || content.name || 'Loading...';
        
        playerPoster.src = posterPath;
        playerTitle.textContent = title;
        playerLoading.classList.remove('hidden');
    }
}

function hidePlayerLoading() {
    const playerLoading = document.getElementById('playerLoading');
    if (playerLoading) {
        playerLoading.classList.add('hidden');
    }
}

// Initialize on DOMContentLoaded for better performance
// Hero Banner Functionality
let heroInterval = null;
let currentHeroIndex = 0;
let heroSlides = [];

async function loadHeroBanner() {
    try {
        const data = await fetchTMDB('/trending/movie/day');
        if (data && data.results) {
            heroSlides = data.results.slice(0, 5);
            // Fetch logos for each movie
            for (let movie of heroSlides) {
                const images = await fetchTMDB(`/movie/${movie.id}/images?include_image_language=en,null`);
                if (images && images.logos && images.logos.length > 0) {
                    movie.logoPath = images.logos[0].file_path;
                }
            }
            renderHeroSlides();
            startHeroAutoplay();
        }
    } catch (error) {
        console.error('Hero banner error:', error);
    }
}

function renderHeroSlides() {
    const heroSlider = document.getElementById('heroSlider');
    if (!heroSlider) return;
    
    heroSlider.innerHTML = heroSlides.map((movie, index) => {
        const backdropPath = movie.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            : `https://image.tmdb.org/t/p/w1280${movie.poster_path}`;
        const year = (movie.release_date || '').split('-')[0];
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
        // Use logo image if available, otherwise use text title
        const titleHTML = movie.logoPath 
            ? `<img src="https://image.tmdb.org/t/p/w500${movie.logoPath}" alt="${movie.title}" class="hero-title-logo">`
            : `<h1 class="hero-title">${movie.title}</h1>`;
        
        return `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="hero-background" style="background-image: url('${backdropPath}')"></div>
                <div class="hero-content">
                    <span class="hero-badge">TRENDING NOW</span>
                    ${titleHTML}
                    <div class="hero-meta">
                        <div class="hero-rating">
                            <span>⭐</span>
                            <span>${rating}</span>
                        </div>
                        <span class="hero-year">${year}</span>
                        <span class="hero-type">Movie</span>
                    </div>
                    <p class="hero-overview">${movie.overview || 'No description available.'}</p>
                    <div class="hero-actions">
                        <button class="hero-btn hero-btn-play" onclick="playMovie(${movie.id})">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Play Now
                        </button>
                        <button class="hero-btn hero-btn-info" onclick="showDetails(${movie.id}, 'movie')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            More Info
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    setupHeroDots();
}

function setupHeroDots() {
    const dots = document.querySelectorAll('.hero-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            goToHeroSlide(index);
        });
    });
}

function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentHeroIndex = index;
}

function startHeroAutoplay() {
    // Clear any existing interval
    if (heroInterval) clearInterval(heroInterval);
    
    // Auto-rotate every 5 seconds
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        goToHeroSlide(currentHeroIndex);
    }, 5000);
}

function stopHeroAutoplay() {
    if (heroInterval) {
        clearInterval(heroInterval);
        heroInterval = null;
    }
}

// Pause autoplay on hover
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopHeroAutoplay);
        heroSection.addEventListener('mouseleave', startHeroAutoplay);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    setupSettingsListeners();
setupProgressTracking();
loadSettingsFromStorage();
    
    // Load hero banner first for immediate visual impact
    loadHeroBanner();
    
    // Load content immediately for better UX
    loadContent();
});

// Functions
async function fetchTMDB(endpoint) {
    // Check cache first
    const cacheKey = endpoint;
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    try {
        // Add api_key parameter correctly (use & if endpoint already has ?)
        const separator = endpoint.includes('?') ? '&' : '?';
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        // Cache the response
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error('TMDB API Error:', error);
        return null;
    }
}

async function loadContent() {
    showLoading(true);
    searchResults.classList.add('hidden');
    
    // Update section titles
    document.querySelector('.featured-section h2').innerHTML = '<span class="section-separator">|</span> Trending Now';
    document.querySelector('.popular-section h2').innerHTML = '<span class="section-separator">|</span> Popular';
    
    // Parallel loading for better performance
    let trendingPromise, popularPromise;
    
    if (currentType === 'anime') {
        // Fetch anime content (Animation genre + Japanese language TV shows)
        trendingPromise = fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc');
        popularPromise = fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100');
    } else {
        trendingPromise = fetchTMDB(`/trending/${currentType}/week`);
        popularPromise = fetchTMDB(`/${currentType}/popular`);
    }
    
    const [continueWatchingPromise] = [loadContinueWatching()];
    
    // Load continue watching first (usually faster)
    await continueWatchingPromise;
    
    // Then load API data in parallel
    const [trending, popular] = await Promise.all([trendingPromise, popularPromise]);
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
    if (trending && trending.results) {
            renderContent(trending.results.slice(0, 12), featuredContent, currentType === 'anime' ? 'tv' : currentType);
    }
    
    if (popular && popular.results) {
            renderContent(popular.results.slice(0, 12), popularContent, currentType === 'anime' ? 'tv' : currentType);
    }
    
    showLoading(false);
    });
}

async function loadGenreContent(genreId, genreName) {
    showLoading(true);
    searchResults.classList.add('hidden');
    
    // Update section titles
    document.querySelector('.featured-section h2').innerHTML = `<span class="section-separator">|</span> ${genreName} Movies`;
    document.querySelector('.popular-section h2').innerHTML = `<span class="section-separator">|</span> ${genreName} TV Shows`;
    
    try {
        const [movies, tvShows] = await Promise.all([
            fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`),
            fetchTMDB(`/discover/tv?with_genres=${genreId}&sort_by=popularity.desc`)
        ]);
        
        requestAnimationFrame(() => {
            if (movies && movies.results) {
                renderContent(movies.results.slice(0, 12), featuredContent);
            }
            
            if (tvShows && tvShows.results) {
                renderContent(tvShows.results.slice(0, 12), popularContent);
            }
            
            showLoading(false);
        });
    } catch (error) {
        console.error('Genre loading error:', error);
        showLoading(false);
    }
}

async function showSearchSuggestions() {
    const query = searchInput.value.trim();
    const resultsTitle = document.getElementById('searchResultsTitle');
    const resultsCount = document.getElementById('searchResultsCount');
    
    try {
        searchSuggestions.innerHTML = '';
        
        if (!query) {
            // Show trending content when search is empty
            resultsTitle.textContent = '| Trending Today';
            
            const trending = await fetchTMDB('/trending/all/day');
            
            if (trending && trending.results) {
                const filtered = trending.results
                    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                    .slice(0, 18);
                
                resultsCount.textContent = `${filtered.length} results found`;
                
                filtered.forEach(item => {
                    searchSuggestions.appendChild(createSearchCard(item, item.media_type));
                });
            }
        } else {
            // Show search results
            resultsTitle.textContent = '| Search Results';
            
            const results = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
            
            if (results && results.results) {
                const filtered = results.results
                    .filter(item => item.media_type === 'movie' || item.media_type === 'tv');
                
                resultsCount.textContent = `${filtered.length} results found`;
                
                if (filtered.length === 0) {
                    searchSuggestions.innerHTML = '<p style="text-align: center; padding: 40px; color: #b3b3b3; grid-column: 1/-1;">No results found</p>';
                } else {
                    filtered.forEach(item => {
                        searchSuggestions.appendChild(createSearchCard(item, item.media_type));
                    });
                }
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsCount.textContent = 'Error loading results';
    }
}

function createSearchCard(item, type) {
    const title = item.title || item.name;
    const posterPath = item.poster_path 
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
        : 'https://via.placeholder.com/200x300?text=No+Image';
    
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        <div class="card-overlay">
            <h3>${title}</h3>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showDetails(item.id, type);
        searchOverlay.classList.remove('active');
        searchInput.value = '';
    });
    
    return card;
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        searchResults.classList.add('hidden');
        return;
    }
    
    showLoading(true);
    
    // Close the search overlay
    searchOverlay.classList.remove('active');
    searchSuggestions.classList.remove('active');
    
    // Show search results section
    searchResults.classList.remove('hidden');
    
    // Scroll to search results
    setTimeout(() => {
        searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    try {
    const results = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
    
    if (results && results.results) {
        const filtered = results.results.filter(item => 
            item.media_type === 'movie' || item.media_type === 'tv'
        );
            
            // Use requestAnimationFrame for smooth rendering
            requestAnimationFrame(() => {
                if (filtered.length === 0) {
                    searchContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #b3b3b3;">No results found for "' + query + '"</p>';
                } else {
        renderContent(filtered, searchContent);
    }
                showLoading(false);
            });
        } else {
            searchContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #b3b3b3;">No results found</p>';
    showLoading(false);
        }
    } catch (error) {
        console.error('Search error:', error);
        searchContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #e50914;">Error searching. Please try again.</p>';
    showLoading(false);
    }
}

function renderContent(items, container, forceType = null) {
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
        const type = forceType || item.media_type || (currentType === 'anime' ? 'tv' : currentType);
        const title = item.title || item.name;
        const posterPath = item.poster_path 
            ? `${TMDB_IMAGE_BASE}${item.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Image';
        const year = (item.release_date || item.first_air_date || '').split('-')[0];
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        
        // Determine quality badge based on popularity and rating
        const quality = getQualityBadge(item);
        
        // Check for saved progress
        let progressHTML = '';
        if (type === 'movie') {
            const progress = getWatchProgress(`movie_${item.id}`);
            if (progress && progress.progress < 95) {
                progressHTML = `<div class="progress-bar"><div class="progress-fill" style="width: ${progress.progress}%"></div></div>`;
            }
        }
        
        const card = document.createElement('div');
        card.className = 'content-card';
        
        // Lazy load images for better performance
        card.innerHTML = `
            <img src="${posterPath}" alt="${title}" loading="lazy">
            ${quality.badge}
            ${progressHTML}
            <div class="info">
                <div class="title">${title}</div>
                <div class="meta">
                    <span>${year || 'N/A'}</span>
                    <span class="rating">
                        <span class="star">⭐</span>
                        ${rating}
                    </span>
                </div>
            </div>
            <div class="play-overlay">
                <div class="play-icon">▶</div>
            </div>
        `;
        
        // Add individual click handler (optimized approach)
        card.addEventListener('click', () => {
            try {
                showDetails(item.id, type);
            } catch (error) {
                console.error('Error showing details:', error);
            }
        }, { once: false });
        
        fragment.appendChild(card);
    });
    
    // Single reflow instead of multiple
    container.innerHTML = '';
    container.appendChild(fragment);
}

// Function to determine quality badge
function getQualityBadge(item) {
    const releaseDate = item.release_date || item.first_air_date;
    const popularity = item.popularity || 0;
    const voteAverage = item.vote_average || 0;
    
    // Check if recently released (within 3 months)
    const isNew = releaseDate && new Date(releaseDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Quality determination logic
    if (popularity > 100 && voteAverage > 7) {
        // High popularity + good rating = HD
        return {
            badge: '<span class="quality-badge quality-hd">HD</span>',
            quality: 'HD'
        };
    } else if (popularity > 50 && voteAverage > 6) {
        // Medium popularity = HD
        return {
            badge: '<span class="quality-badge quality-hd">HD</span>',
            quality: 'HD'
        };
    } else if (isNew && voteAverage < 6) {
        // New + lower rating = might be CAM
        return {
            badge: '<span class="quality-badge quality-cam">CAM</span>',
            quality: 'CAM'
        };
    } else if (isNew && popularity < 50) {
        // New + low popularity = might be TS
        return {
            badge: '<span class="quality-badge quality-ts">TS</span>',
            quality: 'TS'
        };
    } else {
        // Default to HD for older content
        return {
            badge: '<span class="quality-badge quality-hd">HD</span>',
            quality: 'HD'
        };
    }
}

// Show details modal
async function showDetails(tmdbId, mediaType) {
    showLoading(true);
    
    try {
        const [details, credits] = await Promise.all([
            fetchTMDB(`/${mediaType}/${tmdbId}`),
            fetchTMDB(`/${mediaType}/${tmdbId}/credits`)
        ]);
        
        if (!details) {
            showLoading(false);
            return;
        }
        
        const title = details.title || details.name;
        const backdropPath = details.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` 
            : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        const posterPath = details.poster_path 
            ? `${TMDB_IMAGE_BASE}${details.poster_path}` 
            : 'https://via.placeholder.com/200x300?text=No+Image';
        const year = (details.release_date || details.first_air_date || '').split('-')[0];
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const runtime = details.runtime || (details.episode_run_time && details.episode_run_time[0]) || 'N/A';
        const genres = details.genres || [];
        const overview = details.overview || 'No overview available.';
        const cast = credits.cast ? credits.cast.slice(0, 6) : [];
        
        detailsContent.innerHTML = `
            <div class="details-backdrop" style="background-image: url('${backdropPath}')"></div>
            <div class="details-info">
                <div class="details-header">
                    <img src="${posterPath}" alt="${title}" class="details-poster">
                    <div class="details-main">
                        <h1 class="details-title">${title}</h1>
                        <div class="details-meta">
                            <span class="details-rating">⭐ ${rating}</span>
                            <span>${year}</span>
                            ${runtime !== 'N/A' ? `<span>${runtime} min</span>` : ''}
                            <span>${mediaType === 'movie' ? 'Movie' : 'TV Series'}</span>
                        </div>
                        <p class="details-overview">${overview}</p>
                        <div class="details-actions">
                            <button class="btn-play" onclick="playFromDetails('${tmdbId}', '${mediaType}')">
                                ▶ Play Now
                            </button>
                        </div>
                    </div>
                </div>
                
                ${genres.length > 0 ? `
                <div class="details-section">
                    <h3><span class="section-separator">|</span> Genres</h3>
                    <div class="details-genres">
                        ${genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${cast.length > 0 ? `
                <div class="details-section">
                    <h3><span class="section-separator">|</span> Cast</h3>
                    <div class="cast-grid">
                        ${cast.map(member => `
                            <div class="cast-member">
                                <img 
                                    src="${member.profile_path ? `${TMDB_IMAGE_BASE}${member.profile_path}` : 'https://via.placeholder.com/120x150?text=No+Photo'}" 
                                    alt="${member.name}" 
                                    class="cast-photo"
                                >
                                <div class="cast-name">${member.name}</div>
                                <div class="cast-character">${member.character || 'Unknown'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        detailsModal.classList.add('active');
        showLoading(false);
    } catch (error) {
        console.error('Error loading details:', error);
        showLoading(false);
    }
}

// Play from details modal (globally accessible)
window.playFromDetails = function(tmdbId, mediaType) {
    detailsModal.classList.remove('active');
    if (mediaType === 'movie') {
        playMovie(tmdbId);
    } else {
        // For TV shows, we need to fetch the show details first
        fetchTMDB(`/tv/${tmdbId}`).then(details => {
            playTVShow(details);
        });
    }
}

async function playMovie(tmdbId) {
    currentContentId = `movie_${tmdbId}`;
    const savedProgress = getWatchProgress(currentContentId);
    
    // Reset video start time for accurate tracking
    videoStartTime = Date.now();
    
    // Fetch movie details for loading screen
    const movieDetails = await fetchTMDB(`/movie/${tmdbId}`);
    
    // Show loading screen with movie poster
    showPlayerLoading(movieDetails);
    
    const params = new URLSearchParams({
        color: PLAYER_CONFIG.color,
        autoPlay: 'true' // Always autoplay for smooth resume
    });
    
    // RESUME DISABLED - Always start from beginning to prevent freeze/loop issues
    // VidKing player has issues with progress parameter causing stuck loops
    if (savedProgress) {
        console.log(`ℹ️ Progress saved at ${Math.floor(savedProgress.timestamp / 60)}:${String(Math.floor(savedProgress.timestamp % 60)).padStart(2, '0')} - starting from beginning to avoid freeze`);
    }
    // Note: You can manually seek to your saved position after video loads
    
    const embedUrl = `${VIDKING_BASE_URL}/embed/movie/${tmdbId}?${params.toString()}`;
    
    if (videoPlayer && playerModal) {
        // Keep iframe loaded, just change src for instant loading
    videoPlayer.src = embedUrl;
    playerModal.classList.add('active');
    
        // Preload iframe for faster initial load
        videoPlayer.setAttribute('loading', 'eager');
        
        // Hide loading screen after iframe loads
        videoPlayer.onload = () => {
            setTimeout(() => {
                hidePlayerLoading();
                
                // On mobile, show controls hint and simulate tap
                if (window.innerWidth <= 768) {
                    const mobileHint = document.getElementById('mobileControlsHint');
                    const iframe = videoPlayer;
                    
                    // Show hint for 4 seconds
                    if (mobileHint) {
                        mobileHint.classList.add('show');
                        setTimeout(() => {
                            mobileHint.classList.remove('show');
                        }, 4000);
                    }
                    
                    // Try to trigger controls
                    if (iframe && iframe.contentWindow) {
                        // Trigger controls by dispatching events
                        iframe.contentWindow.postMessage({ action: 'showControls' }, '*');
                        
                        // Also simulate touch events on the iframe itself
                        try {
                            const touchEvent = new TouchEvent('touchstart', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            iframe.dispatchEvent(touchEvent);
                        } catch (e) {
                            // TouchEvent constructor not supported, use generic event
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            iframe.dispatchEvent(clickEvent);
                        }
                    }
                }
            }, 1000);
        };
    } else {
        console.error('Player elements not found');
    }
}

async function playTVShow(show) {
    currentShow = show;
    
    // Fetch show details to get number of seasons
    const details = await fetchTMDB(`/tv/${show.id}`);
    if (details) {
        totalSeasons = details.number_of_seasons || 1;
        
        // Show loading screen with show poster
        showPlayerLoading(details);
    }
    
    // Start with season 1, episode 1
    currentSeason = 1;
    playEpisode(show.id, 1, 1);
}

function playEpisode(tmdbId, season, episode) {
    currentContentId = `tv_${tmdbId}_s${season}e${episode}`;
    const savedProgress = getWatchProgress(currentContentId);
    
    // Reset video start time for accurate tracking
    videoStartTime = Date.now();
    
    const params = new URLSearchParams({
        color: PLAYER_CONFIG.color,
        autoPlay: 'true', // Always autoplay for smooth resume
        nextEpisode: PLAYER_CONFIG.nextEpisode,
        episodeSelector: PLAYER_CONFIG.episodeSelector
    });
    
    // RESUME DISABLED - Always start from beginning to prevent freeze/loop issues
    // VidKing player has issues with progress parameter causing stuck loops
    if (savedProgress) {
        console.log(`ℹ️ Progress saved at ${Math.floor(savedProgress.timestamp / 60)}:${String(Math.floor(savedProgress.timestamp % 60)).padStart(2, '0')} - starting from beginning to avoid freeze`);
    }
    // Note: You can manually seek to your saved position after video loads
    
    const embedUrl = `${VIDKING_BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}?${params.toString()}`;
    
    if (videoPlayer && playerModal) {
        // Keep iframe loaded, just change src for instant loading
    videoPlayer.src = embedUrl;
    playerModal.classList.add('active');
    
        // Preload iframe for faster initial load
        videoPlayer.setAttribute('loading', 'eager');
        
        // Hide loading screen after iframe loads
        videoPlayer.onload = () => {
            setTimeout(() => {
                hidePlayerLoading();
                
                // On mobile, show controls hint and simulate tap
                if (window.innerWidth <= 768) {
                    const mobileHint = document.getElementById('mobileControlsHint');
                    const iframe = videoPlayer;
                    
                    // Show hint for 4 seconds
                    if (mobileHint) {
                        mobileHint.classList.add('show');
                        setTimeout(() => {
                            mobileHint.classList.remove('show');
                        }, 4000);
                    }
                    
                    // Try to trigger controls
                    if (iframe && iframe.contentWindow) {
                        // Trigger controls by dispatching events
                        iframe.contentWindow.postMessage({ action: 'showControls' }, '*');
                        
                        // Also simulate touch events on the iframe itself
                        try {
                            const touchEvent = new TouchEvent('touchstart', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            iframe.dispatchEvent(touchEvent);
                        } catch (e) {
                            // TouchEvent constructor not supported, use generic event
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            iframe.dispatchEvent(clickEvent);
                        }
                    }
                }
            }, 1000);
        };
    } else {
        console.error('Player elements not found');
    }
}

// Episode selector removed - using VidKing's built-in episode selector instead

function closePlayerModal() {
    playerModal.classList.remove('active');
    videoPlayer.src = '';
    
    // Reset video start time
    videoStartTime = 0;
    lastEndedTime = 0;
    
    // Reload continue watching after player closes to update UI (longer delay to ensure cleanup)
    setTimeout(() => loadContinueWatching(), 1500);
}

function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Progress Tracking Functions
let lastSavedPosition = 0;
let saveProgressTimeout = null;
let videoStartTime = 0; // Track when video starts
let lastEndedTime = 0; // Track last 'ended' event to prevent rapid loops
let failedVideos = {}; // Track videos that fail repeatedly
let stuckPositionCount = {}; // Track if video is stuck at same position

// Track if progress tracking has been set up
let progressTrackingSetup = false;

function setupProgressTracking() {
    // Only set up once to prevent duplicate event listeners
    if (progressTrackingSetup) return;
    progressTrackingSetup = true;
    
    window.addEventListener('message', function(event) {
        if (typeof event.data === 'string') {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'PLAYER_EVENT' && message.data) {
                    handlePlayerEvent(message.data);
                }
            } catch (e) {
                // Not a JSON message, ignore
            }
        }
    });
}

function handlePlayerEvent(data) {
    const { event, currentTime, duration, progress, id, mediaType, season, episode } = data;
    
    // Handle error events - just log, don't remove (errors can be temporary)
    if (event === 'error') {
        console.warn('⚠️ Player error detected (may be temporary)');
        return; // Don't process error events
    }
    
    // Track when video starts
    if (event === 'play' && currentTime < 10) {
        videoStartTime = Date.now();
    }
    
    // Generate content ID
    let contentId;
    if (mediaType === 'movie') {
        contentId = `movie_${id}`;
    } else {
        contentId = `tv_${id}_s${season}e${episode}`;
    }
    
    // Save progress intelligently - only when position changes significantly or on pause
    if (event === 'timeupdate') {
        // Don't save if video just started (might be in error loop)
        const timeSinceStart = Date.now() - videoStartTime;
        if (timeSinceStart < 5000) {
            // Wait at least 5 seconds before saving progress
            return;
        }
        
        // Only save if position changed by more than 5 seconds to reduce writes
        if (Math.abs(currentTime - lastSavedPosition) >= 5) {
            lastSavedPosition = currentTime;
            
            // Debounce the save to avoid too many writes
            if (saveProgressTimeout) {
                clearTimeout(saveProgressTimeout);
            }
            
            saveProgressTimeout = setTimeout(() => {
        saveWatchProgress(contentId, {
            timestamp: currentTime,
            duration: duration,
            progress: progress,
            mediaType: mediaType,
            id: id,
            season: season,
            episode: episode,
            lastWatched: Date.now()
        });
            }, 2000); // Save after 2 seconds of stable position
        }
    } else if (event === 'pause') {
        // Save immediately on pause for accurate resume
        if (saveProgressTimeout) {
            clearTimeout(saveProgressTimeout);
        }
        lastSavedPosition = currentTime;
        saveWatchProgress(contentId, {
            timestamp: currentTime,
            duration: duration,
            progress: progress,
            mediaType: mediaType,
            id: id,
            season: season,
            episode: episode,
            lastWatched: Date.now()
        });
    } else if (event === 'play') {
        // Update last saved position when playing
        lastSavedPosition = currentTime;
    }
    
    // Clear progress only when video actually ends properly (not errors or quick failures)
    if (event === 'ended') {
        // Prevent rapid consecutive 'ended' events (debounce to stop loops)
        const now = Date.now();
        if (now - lastEndedTime < 10000) {
            // Ignore if we got an 'ended' event less than 10 seconds ago (prevents rapid looping)
            console.log('⏩ Ignoring rapid ended event (preventing loop)');
            return;
        }
        lastEndedTime = now;
        
        // Check if video actually played for a reasonable time
        const timeSinceStart = now - videoStartTime;
        
        // If video played for more than 30 seconds OR reached past 1 minute of content, it's legit
        if (timeSinceStart > 30000 && currentTime > 60) {
            // Video played for a reasonable time, clear progress
            console.log(`✓ Video finished watching: ${contentId}`);
        clearWatchProgress(contentId);
            // Reset failure count
            delete failedVideos[contentId];
        } else if (timeSinceStart < 10000) {
            // Video failed very quickly (less than 10 seconds) - likely broken
            console.warn(`⚠️ Video failed to load (${Math.round(timeSinceStart/1000)}s). Removing from Continue Watching.`);
            
            // Mark as failed
            failedVideos[contentId] = (failedVideos[contentId] || 0) + 1;
            
            // Close player and remove
            const playerModal = document.getElementById('playerModal');
            const videoPlayer = document.getElementById('videoPlayer');
            if (playerModal && videoPlayer) {
                playerModal.classList.remove('active');
                videoPlayer.src = '';
            }
            
            localStorage.removeItem(`vidking_progress_${contentId}`);
            
            setTimeout(() => loadContinueWatching(), 1500);
            
            if (window.showAlert) {
                showAlert('This video is unavailable.', 'error', 'Video Unavailable');
            }
        } else {
            // Video started but ended early (10-30 seconds) - keep progress but don't clear
            console.log('⏸️ Video ended early - keeping progress for resume');
        }
    }
}

function saveWatchProgress(contentId, data) {
    try {
        // Check if video is stuck at the same position (loop detection)
        const existing = localStorage.getItem(`vidking_progress_${contentId}`);
        if (existing) {
            const existingData = JSON.parse(existing);
            const timeDiff = Math.abs(data.timestamp - existingData.timestamp);
            
            // If timestamp is almost the same (within 3 seconds) multiple times, video might be stuck
            if (timeDiff < 3) {
                if (!stuckPositionCount[contentId]) {
                    stuckPositionCount[contentId] = 1;
                } else {
                    stuckPositionCount[contentId]++;
                }
                
                // If stuck at same position 5 times, clear the progress (video is looping)
                if (stuckPositionCount[contentId] >= 5) {
                    console.warn(`⚠️ Video stuck at position ${Math.floor(data.timestamp)}s. Clearing progress to avoid loop.`);
                    localStorage.removeItem(`vidking_progress_${contentId}`);
                    delete stuckPositionCount[contentId];
                    setTimeout(() => loadContinueWatching(), 1000);
                    return;
                }
            } else {
                // Position changed significantly, reset stuck counter
                delete stuckPositionCount[contentId];
            }
        }
        
        localStorage.setItem(`vidking_progress_${contentId}`, JSON.stringify(data));
        
        // Save to server if logged in (throttled to avoid too many requests)
        if (window.FlixAuth && window.FlixAuth.isLoggedIn()) {
            // Only save to server every 10 seconds to reduce server load
            if (!saveWatchProgress.lastServerSave || Date.now() - saveWatchProgress.lastServerSave > 10000) {
            window.FlixAuth.saveWatchProgress({
                content_id: contentId,
                media_type: data.mediaType,
                tmdb_id: data.id,
                    title: '',
                poster_path: '',
                season: data.season,
                episode: data.episode,
                timestamp: data.timestamp,
                duration: data.duration,
                progress: data.progress
            });
                saveWatchProgress.lastServerSave = Date.now();
            }
        }
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

function getWatchProgress(contentId) {
    try {
        const data = localStorage.getItem(`vidking_progress_${contentId}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to get progress:', e);
        return null;
    }
}

function clearWatchProgress(contentId) {
    try {
        localStorage.removeItem(`vidking_progress_${contentId}`);
        // Only reload continue watching if player is closed
        setTimeout(() => {
            const playerModal = document.getElementById('playerModal');
            if (!playerModal || !playerModal.classList.contains('active')) {
        loadContinueWatching();
            }
        }, 1000);
    } catch (e) {
        console.error('Failed to clear progress:', e);
    }
}

function clearAllProgress() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('vidking_progress_')) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.error('Failed to clear all progress:', e);
    }
}

// Prevent rapid reloading
let lastContinueWatchingLoad = 0;

async function loadContinueWatching() {
    // Prevent loading too frequently (throttle to once per 3 seconds)
    const now = Date.now();
    if (now - lastContinueWatchingLoad < 3000) {
        console.log('⏳ Continue Watching reload throttled (preventing spam)');
        return; // Skip if loaded recently
    }
    lastContinueWatchingLoad = now;
    
    const progressItems = [];
    
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('vidking_progress_')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.progress < 95) {
                    progressItems.push(data);
                }
            }
        });
    } catch (e) {
        console.error('Failed to load continue watching:', e);
    }
    
    if (progressItems.length === 0) {
        continueWatchingSection.classList.add('hidden');
        return;
    }
    
    // Sort by last watched (most recent first)
    progressItems.sort((a, b) => b.lastWatched - a.lastWatched);
    
    // Clear and prepare container
    continueWatchingContent.innerHTML = '';
    continueWatchingSection.classList.remove('hidden');
    
    // Fetch all details in parallel for better performance
    const topItems = progressItems.slice(0, 6);
    const detailsPromises = topItems.map(item => {
        const endpoint = item.mediaType === 'movie' 
            ? `/movie/${item.id}` 
            : `/tv/${item.id}`;
        return fetchTMDB(endpoint).then(details => ({ details, item }));
    });
    
    const results = await Promise.all(detailsPromises);
        
    // Use DocumentFragment for batch rendering
    const fragment = document.createDocumentFragment();
    results.forEach(({ details, item }) => {
        if (details) {
            const card = createContinueWatchingCard(details, item);
            fragment.appendChild(card);
        }
    });
    
    continueWatchingContent.appendChild(fragment);
    
    // Setup carousel navigation
    setupCarouselNavigation();
}

function setupCarouselNavigation() {
    const leftBtn = document.getElementById('continueWatchingLeft');
    const rightBtn = document.getElementById('continueWatchingRight');
    const carousel = continueWatchingContent;
    
    if (!leftBtn || !rightBtn || !carousel) return;
    
    // Check if carousel needs navigation (has overflow)
    function checkIfNavigationNeeded() {
        const hasOverflow = carousel.scrollWidth > carousel.clientWidth;
        
        if (hasOverflow) {
            leftBtn.style.display = 'flex';
            rightBtn.style.display = 'flex';
        } else {
            leftBtn.style.display = 'none';
            rightBtn.style.display = 'none';
        }
        
        return hasOverflow;
    }
    
    // Update button states based on scroll position
    function updateButtonStates() {
        const scrollLeft = carousel.scrollLeft;
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        
        // Disable left button if at start
        if (scrollLeft <= 0) {
            leftBtn.disabled = true;
        } else {
            leftBtn.disabled = false;
        }
        
        // Disable right button if at end
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
            rightBtn.disabled = true;
        } else {
            rightBtn.disabled = false;
        }
    }
    
    // Scroll amount (scroll by 3 cards)
    const scrollAmount = 660; // (200px card + 20px gap) * 3
    
    // Left button click
    leftBtn.addEventListener('click', () => {
        carousel.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });
    
    // Right button click
    rightBtn.addEventListener('click', () => {
        carousel.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
    
    // Update button states on scroll
    carousel.addEventListener('scroll', updateButtonStates);
    
    // Check if navigation is needed and update button states
    const needsNav = checkIfNavigationNeeded();
    if (needsNav) {
        updateButtonStates();
    }
    
    // Re-check on window resize
    window.addEventListener('resize', () => {
        const needsNav = checkIfNavigationNeeded();
        if (needsNav) {
            updateButtonStates();
        }
    });
}

function createContinueWatchingCard(details, progressData) {
    const type = progressData.mediaType;
    const title = details.title || details.name;
    const posterPath = details.poster_path 
        ? `${TMDB_IMAGE_BASE}${details.poster_path}` 
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    // Get quality badge for continue watching
    const quality = getQualityBadge(details);
    
    const card = document.createElement('div');
    card.className = 'content-card';
    
    // Generate content ID for removal
    const contentId = type === 'movie' 
        ? `movie_${progressData.id}` 
        : `tv_${progressData.id}_s${progressData.season}e${progressData.episode}`;
    
    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        ${quality.badge}
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressData.progress}%"></div>
        </div>
        <button class="remove-continue-btn" title="Remove from Continue Watching">×</button>
        <div class="info">
            <div class="title">${title}</div>
            <div class="meta">
                <span>${type === 'movie' ? 'Movie' : `S${progressData.season} E${progressData.episode}`}</span>
                <span class="progress-text">${Math.floor(progressData.progress)}%</span>
            </div>
        </div>
        <div class="play-overlay">
            <div class="play-icon">▶</div>
        </div>
    `;
    
    // Remove button handler
    const removeBtn = card.querySelector('.remove-continue-btn');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        clearWatchProgress(contentId);
    });
    
    // Play handler
    card.addEventListener('click', () => {
        // Continue watching cards should resume playback directly
        if (type === 'movie') {
            playMovie(progressData.id);
        } else {
            playEpisode(progressData.id, progressData.season, progressData.episode);
            playTVShow(details);
        }
    }, { once: false });
    
    return card;
}

function saveSettings() {
    try {
        localStorage.setItem('vidking_player_config', JSON.stringify(PLAYER_CONFIG));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

function loadSettingsFromStorage() {
    try {
        const saved = localStorage.getItem('vidking_player_config');
        if (saved) {
            const config = JSON.parse(saved);
            Object.assign(PLAYER_CONFIG, config);
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

function loadSettings() {
    // Set color button
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === PLAYER_CONFIG.color);
    });
    
    // Set checkboxes
    document.getElementById('autoPlayToggle').checked = PLAYER_CONFIG.autoPlay;
    document.getElementById('nextEpisodeToggle').checked = PLAYER_CONFIG.nextEpisode;
    document.getElementById('episodeSelectorToggle').checked = PLAYER_CONFIG.episodeSelector;
}


