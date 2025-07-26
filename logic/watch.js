// watch.js
// --- CÁC HÀM TIỆN ÍCH CHUNG (ĐÃ CHUYỂN SANG MAIN.JS) ---
// startWatching (đã chuyển sang main.js)
// createMovieCard (đã chuyển sang main.js)

function addMovieToHistory(movieId) {
    if (!movieId) return;
    const MAX_HISTORY_LENGTH = 20;
    let history = JSON.parse(localStorage.getItem('movieHistory') || '[]');
    history = history.filter(id => id !== movieId);
    history.unshift(movieId);
    if (history.length > MAX_HISTORY_LENGTH) {
        history = history.slice(0, MAX_HISTORY_LENGTH);
    }
    localStorage.setItem('movieHistory', JSON.stringify(history));
}

function initializeSuggestions(currentMovieId) {
    const suggestionsGrid = document.getElementById('suggestions-grid');
    if (!suggestionsGrid) return;
    const SUGGESTIONS_COUNT = 6;
    const potentialSuggestions = MOVIES_DATA.filter(m => m.id !== currentMovieId);
    for (let i = potentialSuggestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialSuggestions[i], potentialSuggestions[j]] = [potentialSuggestions[j], potentialSuggestions[i]];
    }
    const suggestions = potentialSuggestions.slice(0, SUGGESTIONS_COUNT);
    suggestionsGrid.innerHTML = '';
    suggestions.forEach(movie => {
        suggestionsGrid.appendChild(createMovieCard(movie));
    });
}

function searchMovies() {
    const query = document.getElementById("search-input").value.trim();
    if (!query) return;
    sessionStorage.setItem('redirectSearch', query);
    window.location.href = 'index.html';
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' 
    });
}

// =================================================================
// === CODE CHÍNH CỦA TRANG WATCH ===
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movie = MOVIES_DATA.find(m => m.id === movieId);

    if (!movie) {
        document.getElementById('movie-title').textContent = 'Không tìm thấy phim!';
        return;
    }

    addMovieToHistory(movieId);
    initializeSuggestions(movieId);
    document.title = movie.title;
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('movie-description-content').innerHTML = movie.description;
    document.getElementById('sidebar-poster-img').src = movie.poster;

    const playerContainer = document.getElementById('iframe-player-container');
    const serverList = document.getElementById('server-list');
    const audioTypeSelection = document.getElementById('audio-type-selection');
    const sourceTitle = document.getElementById('source-title');

    function playInIframe(url) {
        playerContainer.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.id = 'iframe-player';
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.border = '0';
        iframe.style.aspectRatio = '16 / 9';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        playerContainer.appendChild(iframe);
        
        scrollToTop(); 
    }

    function renderServerButtons(sources, selectedAudioType) {
        serverList.innerHTML = '';
        const sourceButtons = [];
        sources.forEach(source => {
            const button = document.createElement('button');
            button.className = 'server-btn';
            button.textContent = source.name;
            button.onclick = () => {
                document.querySelectorAll('#server-list .server-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.disabled = false;
                });
                button.classList.add('active');
                button.disabled = true;
                playInIframe(source.url);
                localStorage.setItem(`lastSourceUrl_${movieId}`, source.url);
                localStorage.setItem(`lastAudioType_${movieId}`, selectedAudioType);
            };
            serverList.appendChild(button);
            sourceButtons.push(button);
        });

        const lastSourceUrl = localStorage.getItem(`lastSourceUrl_${movieId}`);
        const lastAudioType = localStorage.getItem(`lastAudioType_${movieId}`);
        let sourceFound = false;

        if (lastSourceUrl && lastAudioType === selectedAudioType) {
            const sourceIndex = sources.findIndex(s => s.url === lastSourceUrl);
            if (sourceIndex !== -1 && sourceButtons[sourceIndex]) {
                sourceButtons[sourceIndex].click();
                sourceFound = true;
            }
        }
        
        if (!sourceFound && sourceButtons.length > 0) {
            sourceButtons[0].click();
        }
    }

    if (movie.sources && Object.keys(movie.sources).length > 0) {
        const audioTypes = Object.keys(movie.sources);

        if (audioTypes.length > 1) {
            sourceTitle.innerHTML = `<i class="fas fa-headphones"></i> Loại âm thanh`;
            audioTypes.forEach(type => {
                const button = document.createElement('button');
                button.className = 'server-btn audio-type-btn';
                button.textContent = type;
                button.onclick = () => {
                    document.querySelectorAll('.audio-type-btn').forEach(btn => {
                        btn.classList.remove('active');
                        btn.disabled = false;
                    });
                    button.classList.add('active');
                    button.disabled = true;
                    renderServerButtons(movie.sources[type], type);
                };
                audioTypeSelection.appendChild(button);
            });
            const serverTitle = document.createElement('h2');
            serverTitle.innerHTML = `<i class="fas fa-server"></i> Nguồn phát`;
            audioTypeSelection.parentNode.insertBefore(serverTitle, serverList);
        } else {
             sourceTitle.innerHTML = `<i class="fas fa-server"></i> Nguồn phát`;
        }

        const lastAudioType = localStorage.getItem(`lastAudioType_${movieId}`);
        const defaultAudioType = lastAudioType && movie.sources[lastAudioType] ? lastAudioType : audioTypes[0];
        
        if (audioTypes.length > 1) {
            const defaultTypeButton = document.querySelector(`#audio-type-selection .server-btn:nth-of-type(${audioTypes.indexOf(defaultAudioType) + 1})`);
            if (defaultTypeButton) {
                defaultTypeButton.click();
            }
        } else {
            renderServerButtons(movie.sources[defaultAudioType], defaultAudioType);
        }

    } else {
        serverList.innerHTML = '<p>Xin lỗi, phim này hiện chưa có nguồn phát.</p>';
    }
    
    const searchInput = document.getElementById('search-input');
    const searchGroup = document.querySelector('.search-group');
    const searchBtn = document.getElementById('search-btn');
    const headerContainer = document.querySelector('.header-container');
    const header = document.querySelector('header'); 

    if (searchGroup && searchInput && searchBtn && headerContainer && header) {
        searchBtn.addEventListener('click', (e) => {
            if (!searchGroup.classList.contains('active')) {
                e.preventDefault();
                searchGroup.classList.add('active');
                headerContainer.classList.add('search-active');
                searchInput.focus();
                header.classList.add('scrolled');
            } else {
                searchMovies();
            }
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchMovies();
        });

        searchInput.addEventListener('search', () => {
            if (searchInput.value === '') {
                searchGroup.classList.remove('active');
                headerContainer.classList.remove('search-active');
                if (window.innerWidth <= 820 && window.scrollY <= 50) {
                    header.classList.remove('scrolled');
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchGroup.contains(e.target) && searchInput.value === '') {
                searchGroup.classList.remove('active');
                headerContainer.classList.remove('search-active');
                if (window.innerWidth <= 820 && window.scrollY <= 50) {
                    header.classList.remove('scrolled');
                }
            }
        });
    }

    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
        if (!header.classList.contains('scrolled')) {
            header.classList.add('scrolled'); 
        }
    }

    const refreshBtn = document.getElementById('refresh-suggestions-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const suggestionsGrid = document.getElementById('suggestions-grid');
            if (!suggestionsGrid) {
                return;
            }
            suggestionsGrid.style.opacity = 0;
            setTimeout(() => {
                initializeSuggestions(movieId);
                suggestionsGrid.style.opacity = 1;
            }, 300);
        });
    }
});