/**
 * Background Music Player Component
 * Uses YouTube IFrame API for background music
 * Allows users to toggle music on/off with preference saved in localStorage
 */

(function() {
    'use strict';

    const YOUTUBE_VIDEO_ID = 'eWCe7psQUxY';
    const STORAGE_KEY = 'dichvucong_music_enabled';
    
    let player = null;
    let isReady = false;
    let isMuted = localStorage.getItem(STORAGE_KEY) === 'false';

    // Load YouTube IFrame API
    function loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            onYouTubeIframeAPIReady();
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // YouTube API callback
    window.onYouTubeIframeAPIReady = function() {
        createPlayer();
    };

    // Create hidden YouTube player
    function createPlayer() {
        // Create container for YouTube player (hidden)
        const container = document.createElement('div');
        container.id = 'yt-music-player';
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(container);

        player = new YT.Player('yt-music-player', {
            height: '1',
            width: '1',
            videoId: YOUTUBE_VIDEO_ID,
            playerVars: {
                autoplay: isMuted ? 0 : 1,
                loop: 1,
                playlist: YOUTUBE_VIDEO_ID, // Required for looping
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }

    // Player ready callback
    function onPlayerReady(event) {
        isReady = true;
        player.setVolume(30); // Set volume to 30%
        
        if (!isMuted) {
            player.playVideo();
        }
        
        updateButtonState();
    }

    // Player state change callback
    function onPlayerStateChange(event) {
        // Loop when video ends
        if (event.data === YT.PlayerState.ENDED) {
            player.playVideo();
        }
    }

    // Player error callback
    function onPlayerError(event) {
        console.warn('YouTube Player Error:', event.data);
    }

    // Toggle music on/off
    function toggleMusic() {
        if (!isReady || !player) return;

        isMuted = !isMuted;
        localStorage.setItem(STORAGE_KEY, !isMuted);

        if (isMuted) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }

        updateButtonState();
    }

    // Update button visual state
    function updateButtonState() {
        const btn = document.getElementById('music-toggle-btn');
        const iconOn = document.getElementById('music-icon-on');
        const iconOff = document.getElementById('music-icon-off');
        const statusText = document.getElementById('music-status-text');

        if (!btn) return;

        if (isMuted) {
            btn.classList.remove('bg-accent');
            btn.classList.add('bg-steel');
            if (iconOn) iconOn.classList.add('hidden');
            if (iconOff) iconOff.classList.remove('hidden');
            if (statusText) statusText.textContent = 'Bật nhạc';
        } else {
            btn.classList.remove('bg-steel');
            btn.classList.add('bg-accent');
            if (iconOn) iconOn.classList.remove('hidden');
            if (iconOff) iconOff.classList.add('hidden');
            if (statusText) statusText.textContent = 'Tắt nhạc';
        }
    }

    // Create floating music control button
    function createMusicButton() {
        const button = document.createElement('div');
        button.id = 'music-toggle-btn';
        button.className = `fixed bottom-4 left-4 z-50 ${isMuted ? 'bg-steel' : 'bg-accent'} text-white rounded-full shadow-formal-lg cursor-pointer transition-all duration-300 hover:scale-110 group`;
        button.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-3">
                <!-- Music On Icon -->
                <svg id="music-icon-on" class="w-6 h-6 ${isMuted ? 'hidden' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
                <!-- Music Off Icon -->
                <svg id="music-icon-off" class="w-6 h-6 ${isMuted ? '' : 'hidden'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke-width="2.5"/>
                </svg>
                <span id="music-status-text" class="text-sm font-medium hidden sm:inline">${isMuted ? 'Bật nhạc' : 'Tắt nhạc'}</span>
            </div>
            <!-- Tooltip on hover -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-primary text-white text-xs rounded-formal opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                🎵 Nhạc nền
            </div>
        `;

        button.addEventListener('click', toggleMusic);
        document.body.appendChild(button);

        // Add pulse animation when music is playing
        addPulseAnimation();
    }

    // Add CSS for pulse animation
    function addPulseAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes music-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(3, 105, 161, 0.4); }
                50% { box-shadow: 0 0 0 10px rgba(3, 105, 161, 0); }
            }
            #music-toggle-btn.bg-accent {
                animation: music-pulse 2s infinite;
            }
            #music-toggle-btn.bg-steel {
                animation: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createMusicButton();
                loadYouTubeAPI();
            });
        } else {
            createMusicButton();
            loadYouTubeAPI();
        }
    }

    // Expose toggle function globally (optional)
    window.MusicPlayer = {
        toggle: toggleMusic,
        isPlaying: () => !isMuted
    };

    // Start
    init();

})();
