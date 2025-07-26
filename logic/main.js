// main.js script loaded.
console.log("main.js script loaded and running.");

// Các biến toàn cục
let currentSlideIndex = 0;
let slideInterval;
let featuredMovies = [];
let currentFilters = {
    genre: '',
    year: '',
    country: ''
};

const ITEMS_PER_PAGE = 12; // Số lượng video mỗi trang

// --- CÁC HÀM TIỆN ÍCH ---

function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    return str;
}

function createMovieCard(movie) {
    const countryText = movie.country ? movie.country : '';
    const isAdult = movie.age && movie.age.includes('18+');
    const adultLabel = isAdult ? `<span class="movie-label age-restriction">18+</span>` : '';

    const div = document.createElement('div');
    div.className = 'movie-item';
    div.onclick = () => openInfoPopup(movie.id);

    div.innerHTML = `
        ${adultLabel}
        ${countryText ? `<span class="movie-label country-label">${countryText}</span>` : ''}
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/160x240/333/ccc?text=No+Image';">
        <h3>${movie.title}</h3>
        <p>Thể loại: ${movie['movie-genre']}</p>
        <p>Năm: ${movie.year}</p>
    `;
    return div;
}

window.openInfoPopup = function (movieId) {
    console.log("Attempting to open info popup for movie ID:", movieId);
    const movie = MOVIES_DATA.find(m => m.id === movieId);
    if (!movie) {
        console.error("Movie not found for ID:", movieId);
        return;
    }

    // Logic mới: Kiểm tra cấu trúc "sources" mới
    let availableAudios = '';
    let audioTypes = [];
    if (movie.sources) {
        audioTypes = Object.keys(movie.sources);
    }
    availableAudios = audioTypes.join(' / ');

    const infoPopup = document.getElementById('movie-info-popup');
    const popupOverlay = document.getElementById('popup-overlay');

    // Đảm bảo các phần tử popup tồn tại trên trang hiện tại
    if (!infoPopup || !popupOverlay) {
        console.warn("Movie info popup elements not found on this page. Redirecting to watch page directly.");
        // Nếu không tìm thấy popup, chuyển hướng trực tiếp đến trang xem phim
        startWatching(movieId);
        return;
    }

    popupOverlay.style.display = 'block';
    infoPopup.style.display = 'block';
    infoPopup.innerHTML = `
        <button class="popup-close-btn" onclick="closeInfoPopup()">×</button>
        <div class="info-title">${movie.title}</div>
        <div class="info-item"><strong>Năm:</strong> ${movie.year}</div>
        ${availableAudios ? `<div class="info-item"><strong>Âm thanh:</strong> ${availableAudios}</div>` : ''}
        <div class="info-item info-description">${movie.description}</div>
        <div class="popup-actions">
            <button class="popup-watch-btn" onclick="startWatching('${movie.id}')"><i class="fas fa-play"></i> Xem ngay</button>
        </div>
    `;
    console.log("Movie info popup displayed.");
}

window.closeInfoPopup = function () {
    console.log("Closing info popup.");
    document.getElementById('popup-overlay').style.display = 'none';
    document.getElementById('movie-info-popup').style.display = 'none';
}

window.startWatching = function (movieId) {
    console.log("Starting to watch movie ID:", movieId);
    window.location.href = `watch.html?id=${movieId}`;
}

// Hàm mới: Cuộn trang lên đầu
function scrollToTop() {
    console.log("Scrolling to top.");
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Cuộn mượt mà
    });
}

// --- LOGIC TRANG CHỦ ---

function initializeHomepage() {
    console.log("Initializing homepage.");
    const sliderContainer = document.querySelector('.hero-slider-container');
    if (!sliderContainer) return;

    // Lọc tất cả các phim có "slide": "1"
    featuredMovies = MOVIES_DATA.filter(movie => movie.slide === "1");

    // Xáo trộn mảng featuredMovies đã lọc
    for (let i = featuredMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [featuredMovies[i], featuredMovies[j]] = [featuredMovies[j], featuredMovies[i]];
    }

    if (featuredMovies.length === 0) return;

    sliderContainer.innerHTML = '';

    featuredMovies.forEach((movie) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        const imageName = movie.poster.split('/').pop();
        const newImagePath = `carousel-images/${imageName}`;
        slide.style.backgroundImage = `url(${newImagePath})`;
        slide.innerHTML = `
            <div class="slide-content">
                <div class="slide-text-wrapper">
                    <h2>${movie.title}</h2>
                    <div class="meta"><span>${movie.country}</span> • <span>${movie.year}</span> • <span>${movie['movie-genre']}</span></div>
                    <p class="description">${movie.description}</p>
                    <div class="slide-actions">
                        <button class="watch-btn" onclick="startWatching('${movie.id}')"><i class="fas fa-play"></i> Xem phim</button>
                    </div>
                </div>
            </div>`;
        sliderContainer.appendChild(slide);
    });

    showSlide(0);
    startSlideInterval(); // Bắt đầu tự động chuyển slide

    // Thêm logic vuốt cho slider
    let isDown = false;
    let startX;
    let endX;

    sliderContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX;
        clearInterval(slideInterval); // Dừng tự động chuyển slide khi bắt đầu vuốt
    });

    sliderContainer.addEventListener('mouseup', (e) => {
        if (!isDown) return;
        isDown = false;
        endX = e.pageX;
        const diffX = startX - endX;

        if (diffX > 50) { // Vuốt sang trái (slide kế tiếp)
            nextSlide();
        } else if (diffX < -50) { // Vuốt sang phải (slide trước đó)
            prevSlide();
        }
        startSlideInterval(); // Khởi động lại tự động chuyển slide sau khi kết thúc vuốt
    });

    sliderContainer.addEventListener('mouseleave', () => {
        if (isDown) { // Nếu chuột rời khỏi khi vẫn đang giữ
            isDown = false;
            startSlideInterval(); // Khởi động lại tự động chuyển slide
        }
    });

    sliderContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Ngăn chọn văn bản khi kéo
    });

    sliderContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        clearInterval(slideInterval); // Dừng tự động chuyển slide khi bắt đầu vuốt
    }, { passive: true }); // Sử dụng passive: true để cải thiện hiệu suất cuộn

    sliderContainer.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].pageX;
        const diffX = startX - endX;

        if (diffX > 50) { // Vuốt sang trái (slide kế tiếp)
            nextSlide();
        } else if (diffX < -50) { // Vuốt sang phải (slide trước đó)
            prevSlide();
        }
        startSlideInterval(); // Khởi động lại tự động chuyển slide sau khi kết thúc vuốt
    });
}


function initializeHomepageSuggestions() {
    console.log("Initializing homepage suggestions.");
    const suggestionsGrid = document.getElementById('homepage-suggestions-grid');
    if (!suggestionsGrid) return;
    const SUGGESTIONS_COUNT = 6;
    const moviesToShuffle = [...MOVIES_DATA];
    for (let i = moviesToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moviesToShuffle[i], moviesToShuffle[j]] = [moviesToShuffle[j], moviesToShuffle[i]];
    }
    const suggestions = moviesToShuffle.slice(0, SUGGESTIONS_COUNT);
    suggestionsGrid.innerHTML = '';
    suggestions.forEach(movie => {
        suggestionsGrid.appendChild(createMovieCard(movie));
    });
}

function initializeMovieScroller() {
    console.log("Initializing movie scroller.");
    const container = document.getElementById('movie-row-full');
    if (!container) return;
    container.innerHTML = '';
    const moviesToShuffle = [...MOVIES_DATA];
    for (let i = moviesToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moviesToShuffle[i], moviesToShuffle[j]] = [moviesToShuffle[j], moviesToShuffle[i]];
    }
    moviesToShuffle.forEach(movie => {
        container.appendChild(createMovieCard(movie));
    });
}

function attachSwipeEvents(element) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let hasDragged = false;

    element.addEventListener('mousedown', (e) => {
        isDown = true;
        hasDragged = false;
        startX = e.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
        element.classList.remove('is-dragging');
    });

    element.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 5) {
            hasDragged = true;
        }
        if (hasDragged) {
            element.classList.add('is-dragging');
            element.scrollLeft = scrollLeft - walk * 2;
        }
    });

    const endDrag = () => {
        isDown = false;
        element.classList.remove('is-dragging');
    };
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);

    element.addEventListener('click', (e) => {
        if (hasDragged) {
            e.stopPropagation();
        }
    }, true);

    element.addEventListener('touchstart', (e) => {
        isDown = true;
        hasDragged = false;
        startX = e.touches[0].pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
        element.classList.remove('is-dragging');
    });

    element.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - element.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 5) {
            hasDragged = true;
        }
        if (hasDragged) {
            element.scrollLeft = scrollLeft - walk * 2;
        }
    });

    element.addEventListener('touchend', endDrag);
}

function setupHistoryScroller() {
    console.log("Setting up history scroller.");
    const scroller = document.querySelector('#history-container .movie-scroller-inner');
    const arrowLeft = document.getElementById('history-arrow-left');
    const arrowRight = document.getElementById('history-arrow-right');
    if (!scroller || !arrowLeft || !arrowRight) return;

    function updateArrows() {
        const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
        arrowLeft.disabled = scroller.scrollLeft < 1;
        arrowRight.disabled = scroller.scrollLeft >= maxScrollLeft - 1;
    }

    arrowLeft.addEventListener('click', () => {
        scroller.scrollBy({ left: -scroller.clientWidth * 0.8, behavior: 'smooth' });
    });

    arrowRight.addEventListener('click', () => {
        scroller.scrollBy({ left: scroller.clientWidth * 0.8, behavior: 'smooth' });
    });

    scroller.addEventListener('scroll', updateArrows);
    new ResizeObserver(updateArrows).observe(scroller);
    new MutationObserver(updateArrows).observe(scroller.querySelector('#history-row-items'), { childList: true });
    updateArrows();
}

function initializeHistorySection() {
    console.log("Initializing history section.");
    const historyContainer = document.getElementById('history-container');
    const historyRow = document.getElementById('history-row-items');
    const scrollerInner = document.querySelector('#history-container .movie-scroller-inner');
    if (!historyContainer || !historyRow || !scrollerInner) return;
    const history = JSON.parse(localStorage.getItem('movieHistory') || '[]');
    if (history.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }
    historyContainer.style.display = 'block';
    historyRow.innerHTML = '';
    history.forEach(movieId => {
        const movie = MOVIES_DATA.find(m => m.id === movieId);
        if (movie) {
            historyRow.appendChild(createMovieCard(movie));
        }
    });
    setupHistoryScroller();
    attachSwipeEvents(scrollerInner);
}

function showSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;
    currentSlideIndex = (index + slides.length) % slides.length;
    slides.forEach(s => s.classList.remove('active'));
    slides[currentSlideIndex].classList.add('active');
}

function nextSlide() { showSlide(currentSlideIndex + 1); }
function prevSlide() { showSlide(currentSlideIndex - 1); } // Thêm hàm prevSlide
function startSlideInterval() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 5000); }

function showHomepageView() {
    console.log("showHomepageView called.");
    // Đảm bảo các phần tử tồn tại trước khi thay đổi style
    const homepageContent = document.getElementById('homepage-content');
    const allMoviesContainer = document.getElementById('all-movies-container');
    const historyContainer = document.getElementById('history-container');
    const searchResultsContainer = document.getElementById('search-results-container');
    const homepageSuggestionsContainer = document.getElementById('homepage-suggestions-container');

    if (homepageContent) homepageContent.style.display = 'block';
    if (allMoviesContainer) allMoviesContainer.style.display = 'block';
    if (historyContainer) historyContainer.style.display = 'block';
    if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    if (homepageSuggestionsContainer) homepageSuggestionsContainer.style.display = 'block';

    initializeHistorySection();
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    scrollToTop(); // Cuộn lên đầu trang
}

// Hàm render danh sách phim cho các chức năng phân trang (Xem tất cả, Tìm kiếm, Lọc)
// movieArray: Mảng phim cần hiển thị
// containerId: ID của container để hiển thị phim (ví dụ: 'search-results-container')
// titleText: Tiêu đề của phần (ví dụ: 'Tất Cả Phim', 'Kết quả tìm kiếm', 'Kết quả lọc')
// currentPage: Trang hiện tại
// totalPages: Tổng số trang
// onPageChange: Callback function khi chuyển trang
function renderMovieGridWithPagination(movieArray, containerId, titleText, currentPage, totalPages, onPageChange) {
    console.log(`renderMovieGridWithPagination called for ${containerId}`);
    console.log(`  Title: ${titleText}, Page: ${currentPage}/${totalPages}`);
    console.log(`  Movie Array Length: ${movieArray.length}`);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found!`);
        return;
    }
    console.log(`Container '${containerId}' found. Current display: ${container.style.display}`);
    container.style.display = 'block'; // Ensure it's visible
    console.log(`Container '${containerId}' display set to: ${container.style.display}`);

    container.innerHTML = ''; // Xóa nội dung cũ

    const titleEl = document.createElement('h2');
    titleEl.id = 'section-title';
    titleEl.textContent = titleText;
    container.appendChild(titleEl);

    if (movieArray.length === 0) {
        container.innerHTML += '<p style="text-align: center;">Không tìm thấy phim phù hợp.</p>';
        console.log("No movies found for current criteria.");
        return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMovies = movieArray.slice(startIndex, endIndex);

    console.log(`Paginated Movies Length: ${paginatedMovies.length} (from index ${startIndex} to ${endIndex})`);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'movie-grid';
    paginatedMovies.forEach(movie => {
        gridContainer.appendChild(createMovieCard(movie));
    });
    container.appendChild(gridContainer);

    // Render pagination controls
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>'; // Icon mũi tên
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => onPageChange(currentPage - 1);
    paginationDiv.appendChild(prevButton);

    // Logic hiển thị 3 ô số trang (hoặc ít hơn nếu tổng trang ít)
    if (totalPages > 1) {
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, currentPage + 1);

        // Điều chỉnh để luôn cố gắng hiển thị 3 trang nếu có đủ
        if (totalPages >= 3) {
            if (currentPage === 1) {
                endPage = 3;
            } else if (currentPage === totalPages) {
                startPage = totalPages - 2;
            } else {
                // Giữ nguyên startPage và endPage đã tính
            }
        } else {
            // Nếu tổng số trang ít hơn 3, hiển thị tất cả các trang
            startPage = 1;
            endPage = totalPages;
        }

        // Đảm bảo không hiển thị số trang trùng lặp hoặc nhảy quá xa
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.onclick = () => onPageChange(1);
            paginationDiv.appendChild(firstPageButton);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationDiv.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.onclick = () => onPageChange(i);
            paginationDiv.appendChild(pageButton);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.classList.add('ellipsis');
                paginationDiv.appendChild(ellipsis);
            }
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.onclick = () => onPageChange(totalPages);
            paginationDiv.appendChild(lastPageButton);
        }
    }


    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>'; // Icon mũi tên
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => onPageChange(currentPage + 1);
    paginationDiv.appendChild(nextButton);

    container.appendChild(paginationDiv);
    scrollToTop(); // Cuộn lên đầu trang sau khi render lưới phim và phân trang
    console.log("Movie grid and pagination rendered. Scrolled to top.");
}


// --- DANH MỤC PHIM (ALL MOVIES) ---
let allMoviesCurrentPage = 1;
let allMoviesFilteredData = [];

function showAllMoviesGrid(page = 1) {
    console.log("showAllMoviesGrid called.");
    allMoviesCurrentPage = page;
    allMoviesFilteredData = MOVIES_DATA; // Toàn bộ dữ liệu phim

    const homepageContent = document.getElementById('homepage-content');
    const allMoviesContainer = document.getElementById('all-movies-container');
    const historyContainer = document.getElementById('history-container');
    const homepageSuggestionsContainer = document.getElementById('homepage-suggestions-container');
    // searchResultsContainer không cần ẩn ở đây vì nó sẽ được renderMovieGridWithPagination xử lý

    if (homepageContent) homepageContent.style.display = 'none';
    if (allMoviesContainer) allMoviesContainer.style.display = 'none'; // Ẩn cái cũ
    if (historyContainer) historyContainer.style.display = 'none';
    if (homepageSuggestionsContainer) homepageSuggestionsContainer.style.display = 'none';

    const totalPages = Math.ceil(allMoviesFilteredData.length / ITEMS_PER_PAGE);
    renderMovieGridWithPagination(
        allMoviesFilteredData,
        'search-results-container',
        'Tất Cả Phim',
        allMoviesCurrentPage,
        totalPages,
        showAllMoviesGrid // Callback để chuyển trang
    );
}

// --- LỊCH SỬ XEM PHIM (HISTORY) ---
let historyCurrentPage = 1;
let historyFilteredData = [];

function showAllHistoryGrid(page = 1) {
    console.log("showAllHistoryGrid called.");
    historyCurrentPage = page;
    const historyIds = JSON.parse(localStorage.getItem('movieHistory') || '[]');
    historyFilteredData = historyIds.map(id => MOVIES_DATA.find(m => m.id === id)).filter(movie => movie);

    const homepageContent = document.getElementById('homepage-content');
    const allMoviesContainer = document.getElementById('all-movies-container');
    const historyContainer = document.getElementById('history-container'); // Ẩn cái cũ
    const homepageSuggestionsContainer = document.getElementById('homepage-suggestions-container');
    // searchResultsContainer không cần ẩn ở đây vì nó sẽ được renderMovieGridWithPagination xử lý

    if (homepageContent) homepageContent.style.display = 'none';
    if (allMoviesContainer) allMoviesContainer.style.display = 'none';
    if (historyContainer) historyContainer.style.display = 'none';
    if (homepageSuggestionsContainer) homepageSuggestionsContainer.style.display = 'none';

    const totalPages = Math.ceil(historyFilteredData.length / ITEMS_PER_PAGE);
    renderMovieGridWithPagination(
        historyFilteredData,
        'search-results-container',
        'Lịch Sử Đã Xem',
        historyCurrentPage,
        totalPages,
        showAllHistoryGrid // Callback để chuyển trang
    );
}

// --- TÌM KIẾM (SEARCH) ---
let searchCurrentPage = 1;
let lastSearchQuery = '';
let searchResultsData = [];

function performSearch(query, originalQuery, page = 1) {
    console.log(`performSearch called for query: "${originalQuery}"`);
    lastSearchQuery = query; // Lưu lại query
    searchCurrentPage = page;

    // Logic lọc tìm kiếm đã được cập nhật
    searchResultsData = MOVIES_DATA.filter(m => {
        // Chuẩn hóa tiêu đề phim về chữ thường, không dấu
        const normalizedTitle = removeVietnameseTones(m.title.toLowerCase());

        // Chuẩn hóa danh sách diễn viên về chữ thường, không dấu.
        // Kiểm tra xem phim có trường 'actor' hay không để tránh lỗi.
        const normalizedActors = m.actor ? removeVietnameseTones(m.actor.toLowerCase()) : '';

        // Trả về true nếu từ khóa tìm kiếm xuất hiện trong tiêu đề HOẶC trong danh sách diễn viên
        return normalizedTitle.includes(query) || normalizedActors.includes(query);
    });

    const homepageContent = document.getElementById('homepage-content');
    const allMoviesContainer = document.getElementById('all-movies-container');
    const historyContainer = document.getElementById('history-container');
    const homepageSuggestionsContainer = document.getElementById('homepage-suggestions-container');

    if (homepageContent) homepageContent.style.display = 'none';
    if (allMoviesContainer) allMoviesContainer.style.display = 'none';
    if (historyContainer) historyContainer.style.display = 'none';
    if (homepageSuggestionsContainer) homepageSuggestionsContainer.style.display = 'none';

    const totalPages = Math.ceil(searchResultsData.length / ITEMS_PER_PAGE);
    renderMovieGridWithPagination(
        searchResultsData,
        'search-results-container',
        `Kết quả tìm kiếm cho: "${originalQuery}"`,
        searchCurrentPage,
        totalPages,
        (newPage) => performSearch(query, originalQuery, newPage) // Callback để chuyển trang
    );
}


// --- FILTER LOGIC ---
let filterCurrentPage = 1;
let currentFilteredData = []; // Dữ liệu đã lọc bởi bộ lọc

// Hàm mới: populate các option cho dropdown lọc (giờ là checkbox)
function populateFilterOptions() {
    console.log("Populating filter options with checkboxes...");
    const genreContainer = document.getElementById('filter-genre-container');
    const yearContainer = document.getElementById('filter-year-container');
    const countryContainer = document.getElementById('filter-country-container');

    if (!genreContainer || !yearContainer || !countryContainer) {
        console.warn("One or more filter container elements not found.");
        return;
    }

    const genres = new Set();
    const years = new Set();
    const countries = new Set();

    MOVIES_DATA.forEach(movie => {
        if (movie['movie-genre']) {
            movie['movie-genre'].split(', ').forEach(genre => genres.add(genre.trim()));
        }
        if (movie.year) {
            years.add(movie.year);
        }
        if (movie.country) {
            countries.add(movie.country);
        }
    });

    // Hàm trợ giúp để tạo một checkbox item
    const createCheckboxItem = (container, value, name) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checkbox-item';
        const checkboxId = `${name}-${value.replace(/[^a-zA-Z0-9]/g, '')}`; // Tạo ID hợp lệ

        itemDiv.innerHTML = `
            <input type="checkbox" id="${checkboxId}" name="${name}" value="${value}">
            <label for="${checkboxId}">${value}</label>
        `;
        container.appendChild(itemDiv);
    };

    // Xóa nội dung cũ
    genreContainer.innerHTML = '';
    yearContainer.innerHTML = '';
    countryContainer.innerHTML = '';

    // Populate genres
    Array.from(genres).sort().forEach(genre => createCheckboxItem(genreContainer, genre, 'genre'));

    // Populate years (sorted descending)
    Array.from(years).sort((a, b) => b - a).forEach(year => createCheckboxItem(yearContainer, year, 'year'));

    // Populate countries (sorted alphabetically)
    Array.from(countries).sort().forEach(country => createCheckboxItem(countryContainer, country, 'country'));

    console.log("Filter options populated.");
}


// Hàm hiển thị phim dựa trên bộ lọc (đã cập nhật cho multi-select)
function displayFilteredMovies(filters, page = 1) {
    console.log("displayFilteredMovies called with multi-select.");
    console.log("  Filters:", filters);
    filterCurrentPage = page;

    if (document.getElementById('watch-page-container')) {
        sessionStorage.setItem('appliedFilters', JSON.stringify(filters));
        window.location.href = 'index.html';
        return;
    }

    currentFilteredData = MOVIES_DATA.filter(movie => {
        // Lọc Thể loại: Phim phải có ÍT NHẤT MỘT thể loại nằm trong danh sách đã chọn
        const movieGenres = movie['movie-genre'] ? movie['movie-genre'].split(',').map(g => g.trim()) : [];
        const matchesGenre = filters.genre.length === 0 || filters.genre.some(selectedGenre => movieGenres.includes(selectedGenre));

        // Lọc Năm: Năm của phim phải nằm trong danh sách năm đã chọn
        const matchesYear = filters.year.length === 0 || filters.year.includes(movie.year);

        // Lọc Quốc gia: Quốc gia của phim phải nằm trong danh sách quốc gia đã chọn
        const matchesCountry = filters.country.length === 0 || filters.country.includes(movie.country);

        return matchesGenre && matchesYear && matchesCountry;
    });

    const homepageContent = document.getElementById('homepage-content');
    const allMoviesContainer = document.getElementById('all-movies-container');
    const homepageSuggestionsContainer = document.getElementById('homepage-suggestions-container');
    const historyContainer = document.getElementById('history-container');

    if (homepageContent) homepageContent.style.display = 'none';
    if (allMoviesContainer) allMoviesContainer.style.display = 'none';
    if (homepageSuggestionsContainer) homepageSuggestionsContainer.style.display = 'none';
    if (historyContainer) historyContainer.style.display = 'none';

    const totalPages = Math.ceil(currentFilteredData.length / ITEMS_PER_PAGE);
    renderMovieGridWithPagination(
        currentFilteredData,
        'search-results-container',
        'Kết quả lọc phim',
        filterCurrentPage,
        totalPages,
        (newPage) => displayFilteredMovies(filters, newPage)
    );
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Initialize filter options for both pages
    populateFilterOptions();

    // Only initialize homepage-specific elements if on index.html
    if (document.getElementById('homepage-content')) {
        initializeHomepage();
        initializeHomepageSuggestions();
        initializeMovieScroller();
        initializeHistorySection();

        // Check for applied filters or search from watch.html redirect
        const appliedFilters = sessionStorage.getItem('appliedFilters');
        const redirectSearchQuery = sessionStorage.getItem('redirectSearch');

        if (appliedFilters) {
            console.log("Applied filters found in session storage. Displaying filtered movies.");
            sessionStorage.removeItem('appliedFilters');
            const parsedFilters = JSON.parse(appliedFilters);
            currentFilters = parsedFilters; // Set current filters
            displayFilteredMovies(parsedFilters); // Display filtered movies

            // Cập nhật lại trạng thái của checkbox dựa trên bộ lọc đã lưu
            if (document.getElementById('filter-genre-container')) {
                parsedFilters.genre.forEach(value => {
                    const cb = document.querySelector(`#filter-genre-container input[value="${value}"]`);
                    if (cb) cb.checked = true;
                });
            }
            if (document.getElementById('filter-year-container')) {
                parsedFilters.year.forEach(value => {
                    const cb = document.querySelector(`#filter-year-container input[value="${value}"]`);
                    if (cb) cb.checked = true;
                });
            }
            if (document.getElementById('filter-country-container')) {
                parsedFilters.country.forEach(value => {
                    const cb = document.querySelector(`#filter-country-container input[value="${value}"]`);
                    if (cb) cb.checked = true;
                });
            }

        } else if (redirectSearchQuery) {
            console.log("Redirect search query found in session storage. Performing search.");
            sessionStorage.removeItem('redirectSearch');
            document.getElementById('search-input').value = redirectSearchQuery;
            performSearch(removeVietnameseTones(redirectSearchQuery.toLowerCase()), redirectSearchQuery);
            const searchGroup = document.querySelector('.search-group');
            const headerContainer = document.querySelector('.header-container');
            if (searchGroup) searchGroup.classList.add('active');
            if (headerContainer) headerContainer.classList.add('search-active');
        }
    }

    document.getElementById('popup-overlay')?.addEventListener('click', closeInfoPopup);

    document.getElementById('logo-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        const searchResultsContainer = document.getElementById('search-results-container');
        // If currently displaying search/filter results, go back to homepage view
        if (searchResultsContainer && searchResultsContainer.style.display === 'block') {
            showHomepageView();
        } else {
            // Otherwise, just reload index.html
            window.location.href = 'index.html';
        }
    });

    const searchInput = document.getElementById('search-input');
    const searchGroup = document.querySelector('.search-group');
    const searchBtn = document.getElementById('search-btn');
    const headerContainer = document.querySelector('.header-container');

    if (searchGroup && searchInput && searchBtn && headerContainer) {
        searchBtn.addEventListener('click', (e) => {
            if (!searchGroup.classList.contains('active')) {
                e.preventDefault();
                searchGroup.classList.add('active');
                headerContainer.classList.add('search-active');
                searchInput.focus();
            } else {
                searchMovies();
            }
        });
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchMovies();
        });
        searchInput.addEventListener('search', () => {
            if (searchInput.value === '' && !document.getElementById('watch-page-container')) {
                showHomepageView();
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchGroup.contains(e.target) && searchInput.value === '') {
                searchGroup.classList.remove('active');
                headerContainer.classList.remove('search-active');
            }
        });
    }

    document.querySelector('#all-movies-container .view-all-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAllMoviesGrid(); // Gọi hàm hiển thị tất cả phim với phân trang
    });

    document.getElementById('view-all-history-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAllHistoryGrid(); // Gọi hàm hiển thị lịch sử với phân trang
    });

    const refreshBtn = document.getElementById('refresh-homepage-suggestions-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const suggestionsGrid = document.getElementById('homepage-suggestions-grid');
            if (!suggestionsGrid) return;
            suggestionsGrid.style.opacity = 0;
            setTimeout(() => {
                initializeHomepageSuggestions();
                suggestionsGrid.style.opacity = 1;
            }, 300);
        });
    }

    // Filter FAB and Popup Logic
    const filterFab = document.getElementById('filter-fab');
    const filterPopup = document.getElementById('filter-popup');
    const filterOverlay = document.getElementById('filter-overlay'); // Get the new overlay
    const filterCloseBtn = document.querySelector('.filter-close-btn');
    const applyFilterBtn = document.getElementById('apply-filter-btn');

    if (filterFab && filterPopup && filterCloseBtn && applyFilterBtn && filterOverlay) {
        console.log("Filter FAB elements found.");

        filterFab.addEventListener('click', () => {
            console.log("Filter FAB clicked.");
            const isFilterPopupVisible = filterPopup.style.display === 'block';
            filterPopup.style.display = isFilterPopupVisible ? 'none' : 'block';
            filterOverlay.style.display = isFilterPopupVisible ? 'none' : 'block'; // Toggle overlay visibility
            console.log("Filter popup display:", filterPopup.style.display);
        });

        filterCloseBtn.addEventListener('click', () => {
            console.log("Filter close button clicked.");
            filterPopup.style.display = 'none';
            filterOverlay.style.display = 'none'; // Hide overlay when closing popup
        });

        applyFilterBtn.addEventListener('click', () => {
            console.log("Apply filter button clicked.");

            // Lấy TẤT CẢ các giá trị đã được chọn từ các checkbox
            const selectedGenres = Array.from(document.querySelectorAll('#filter-genre-container input:checked')).map(cb => cb.value);
            const selectedYears = Array.from(document.querySelectorAll('#filter-year-container input:checked')).map(cb => cb.value);
            const selectedCountries = Array.from(document.querySelectorAll('#filter-country-container input:checked')).map(cb => cb.value);

            currentFilters = {
                genre: selectedGenres,
                year: selectedYears,
                country: selectedCountries
            };

            displayFilteredMovies(currentFilters);
            filterPopup.style.display = 'none';
            filterOverlay.style.display = 'none';
        });

        // Close filter popup if clicked outside (including the overlay)
        filterOverlay.addEventListener('click', () => {
            console.log("Filter overlay clicked.");
            filterPopup.style.display = 'none';
            filterOverlay.style.display = 'none';
        });
    } else {
        console.error("One or more filter FAB/Popup elements not found. Filter functionality might not work.");
        console.log("filterFab:", filterFab);
        console.log("filterPopup:", filterPopup);
        console.log("filterOverlay:", filterOverlay);
        console.log("filterCloseBtn:", filterCloseBtn);
        console.log("applyFilterBtn:", applyFilterBtn);
    }
    // Đặt đoạn mã này bên cạnh các khai báo biến của filter
    // Đặt đoạn mã này bên cạnh các khai báo biến của filter
    const resetFilterBtn = document.getElementById('reset-filter-btn');

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            console.log("Reset filter button clicked.");

            // Bỏ chọn tất cả các checkbox trong popup
            const checkboxes = document.querySelectorAll('#filter-popup input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            // Đặt lại biến lưu trữ bộ lọc
            currentFilters = {
                genre: [],
                year: [],
                country: []
            };

            // --- ĐÃ XÓA CÁC DÒNG ĐÓNG POPUP VÀ HIỂN THỊ LẠI TRANG CHỦ ---
            // Giờ đây người dùng có thể chọn lại bộ lọc hoặc nhấn "Áp dụng"
        });
    }
});
function searchMovies() {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
        // Tên query không dấu và chữ thường
        const normalizedQuery = removeVietnameseTones(query.toLowerCase());

        // Kiểm tra xem đang ở trang xem phim hay không
        if (document.getElementById('watch-page-container')) {
            // Nếu ở trang watch, lưu query vào sessionStorage và chuyển hướng về index.html
            sessionStorage.setItem('redirectSearch', query);
            window.location.href = 'index.html';
        } else {
            // Nếu ở trang index, thực hiện tìm kiếm ngay lập tức
            performSearch(normalizedQuery, query);
        }
    }
}