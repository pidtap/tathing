// update.js
document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // CÀI ĐẶT TÊN ĐĂNG NHẬP VÀ MẬT KHẨU
    // Thay đổi "admin" và "12345" thành thông tin bạn muốn
    // =================================================================
    const CORRECT_USERNAME = "admin";
    const CORRECT_PASSWORD = "12346";

    // --- Elements for Password Protection ---
    const passwordOverlay = document.getElementById('password-overlay');
    const mainContent = document.getElementById('main-content');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const passwordError = document.getElementById('password-error');

    // --- Elements for Custom Alert ---
    const alertOverlay = document.getElementById('custom-alert-overlay');
    const alertBox = document.getElementById('custom-alert-box');
    const alertIcon = document.getElementById('custom-alert-icon');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertConfirmBtn = document.getElementById('custom-alert-confirm-btn');
    const alertCancelBtn = document.getElementById('custom-alert-cancel-btn');

    // Make a copy of the original data to work with
    let moviesData = JSON.parse(JSON.stringify(MOVIES_DATA));
    let currentFilteredMovies = [...moviesData]; // The list of movies currently being displayed (can be all or filtered)

    // Pagination state
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;

    const movieListEl = document.getElementById('movie-list');
    const paginationContainer = document.getElementById('pagination-container');
    const movieCountDisplay = document.getElementById('movie-count-display');
    const modal = document.getElementById('edit-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const addNewMovieBtn = document.getElementById('add-new-movie-btn');
    const editForm = document.getElementById('edit-form');
    const downloadBtn = document.getElementById('download-btn');
    const sourcesContainer = document.getElementById('sources-container');
    const addSourceTypeBtn = document.getElementById('add-source-type-btn');
    
    // --- Get form elements for auto-generation and autofill ---
    const titleInput = document.getElementById('title');
    const yearInput = document.getElementById('year');
    const idInput = document.getElementById('id');
    const posterInput = document.getElementById('poster');
    const countryInput = document.getElementById('country');
    const genreInput = document.getElementById('movie-genre');
    const actorInput = document.getElementById('actor');
    const descriptionInput = document.getElementById('description');
    
    const autofillBtn = document.getElementById('autofill-btn');
    const autofillLoader = document.getElementById('autofill-loader');
    const searchInput = document.getElementById('search-input');

    // --- Custom Alert Function ---
    function showCustomAlert(message, type = 'success') {
        return new Promise((resolve) => {
            alertMessage.innerHTML = message; 
            
            alertIcon.className = '';
            alertBox.style.borderColor = '';

            switch (type) {
                case 'error':
                    alertIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                    alertIcon.className = 'error';
                    alertBox.style.borderColor = '#dc3545';
                    alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'Đóng';
                    break;
                case 'confirm':
                    alertIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
                    alertIcon.className = 'confirm';
                    alertBox.style.borderColor = 'var(--color-accent-hover)';
                    alertCancelBtn.style.display = 'inline-block';
                    alertConfirmBtn.innerText = 'Xác nhận';
                    break;
                case 'success':
                default:
                    alertIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                    alertIcon.className = 'success';
                    alertBox.style.borderColor = '#28a745';
                    alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'OK';
                    break;
            }

            alertOverlay.classList.add('visible');

            alertConfirmBtn.onclick = () => {
                alertOverlay.classList.remove('visible');
                resolve(true);
            };

            alertCancelBtn.onclick = () => {
                alertOverlay.classList.remove('visible');
                resolve(false);
            };
        });
    }


    // --- Helper Functions for ID Generation ---
    function removeVietnameseTones(str) {
        if (!str) return '';
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

    function generateSlug(title, year) {
        if (!title) return '';
        let slug = removeVietnameseTones(title);
        slug = slug.toLowerCase()
                   .replace(/ /g, '-')
                   .replace(/[^\w-]+/g, '')
                   .replace(/--+/g, '-');
        
        const yearCleaned = year.trim();
        if (yearCleaned) {
            slug = `${slug}-${yearCleaned}`;
        }
        return slug;
    }
    
    function autoUpdateGeneratedFields() {
        if (!idInput.readOnly) {
            const title = titleInput.value;
            const year = yearInput.value;
            const generatedId = generateSlug(title, year);
            idInput.value = generatedId;
            idInput.dispatchEvent(new Event('input'));
        }
    }

    async function getApiKey() {
        try {
            const response = await fetch('api.txt');
            if (!response.ok) throw new Error('Không tìm thấy file api.txt.');
            const text = await response.text();
            const key = text.split(':')[1].trim().replace(/"/g, '');
            if (!key) throw new Error('Định dạng file api.txt không đúng.');
            return key;
        } catch (error) {
            console.error("Lỗi khi đọc API key:", error);
            return null;
        }
    }


    // --- Core Functions ---
    function updateMovieCount() {
        if (movieCountDisplay) {
            const filteredCount = currentFilteredMovies.length;
            const totalCount = moviesData.length;
            if (filteredCount === totalCount) {
                movieCountDisplay.textContent = `Tổng số: ${totalCount} phim.`;
            } else {
                movieCountDisplay.textContent = `Tìm thấy ${filteredCount} / ${totalCount} phim.`;
            }
        }
    }

    function displayPage(page) {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        currentPage = page;
        movieListEl.innerHTML = '';
        
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedItems = currentFilteredMovies.slice(start, end);

        paginatedItems.forEach(movie => {
            const movieEl = document.createElement('div');
            movieEl.className = 'movie-list-item';
            movieEl.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/60x90/333/ccc?text=No+Img';">
                <div class="movie-list-info">
                    <h3>${movie.title}</h3>
                    <p>ID: ${movie.id} | Năm: ${movie.year}</p>
                </div>
                <div class="movie-list-actions">
                    <button class="check-btn" data-id="${movie.id}"><i class="fas fa-eye"></i> Kiểm tra</button>
                    <button class="edit-btn" data-id="${movie.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="delete-btn" data-id="${movie.id}"><i class="fas fa-trash"></i> Xóa</button>
                </div>
            `;
            movieListEl.appendChild(movieEl);
        });
        
        renderPaginationControls();
        updateMovieCount();
    }

    function renderPaginationControls() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredMovies.length / ITEMS_PER_PAGE);

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '«';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) displayPage(currentPage - 1);
        });
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            if (i === currentPage) pageButton.classList.add('active');
            pageButton.addEventListener('click', () => displayPage(i));
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '»';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) displayPage(currentPage + 1);
        });
        paginationContainer.appendChild(nextButton);
    }

    function openModal(movieId = null) {
        editForm.reset();
        sourcesContainer.innerHTML = '';
        
        if (movieId) {
            const movie = moviesData.find(m => m.id === movieId);
            if (movie) {
                document.getElementById('modal-title').textContent = 'Sửa thông tin phim';
                document.getElementById('movie-id-input').value = movie.id;
                idInput.value = movie.id;
                idInput.readOnly = true;
                titleInput.value = movie.title || '';
                yearInput.value = movie.year || '';
                posterInput.value = movie.poster || '';
                countryInput.value = movie.country || '';
                genreInput.value = movie['movie-genre'] || '';
                actorInput.value = movie.actor || '';
                document.getElementById('category').value = movie.category || 'phim-le';
                document.getElementById('age').value = movie.age || '';
                document.getElementById('slide').value = movie.slide || '0';
                descriptionInput.value = movie.description || '';
                
                if (movie.sources && typeof movie.sources === 'object') {
                    for (const audioType in movie.sources) {
                        addSourceTypeToForm(audioType, movie.sources[audioType]);
                    }
                }
            }
        } else {
            document.getElementById('modal-title').textContent = 'Thêm phim mới';
            document.getElementById('movie-id-input').value = '';
            idInput.readOnly = false;
        }
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    async function deleteMovie(movieId) {
        const confirmed = await showCustomAlert(`Bạn có chắc chắn muốn xóa phim có ID: ${movieId}?`, 'confirm');
        if (confirmed) {
            moviesData = moviesData.filter(m => m.id !== movieId);
            filterMovies();
            showCustomAlert('Đã xóa phim thành công!', 'success');
        }
    }

    async function saveMovie(e) {
        e.preventDefault();
        const existingId = document.getElementById('movie-id-input').value;
        const newId = idInput.value.trim();
        
        if (!newId) {
            showCustomAlert('ID phim là bắt buộc! Vui lòng nhập tiêu đề và năm để tạo ID.', 'error');
            return;
        }

        if (!existingId && moviesData.some(m => m.id === newId)) {
            showCustomAlert(`ID phim "${newId}" đã tồn tại. Vui lòng chọn ID khác.`, 'error');
            return;
        }
        
        const sources = {};
        let hasDuplicateAudioType = false;
        const sourceTypeGroups = sourcesContainer.querySelectorAll('.source-type-group');
        
        sourceTypeGroups.forEach(group => {
            if (hasDuplicateAudioType) return;
            const audioType = group.querySelector('.audio-type-select').value;
            if (audioType) {
                if (sources[audioType]) {
                    showCustomAlert(`Lỗi: Loại âm thanh "${audioType}" bị trùng lặp.`, 'error');
                    hasDuplicateAudioType = true;
                    return;
                }
                sources[audioType] = [];
                const serverItems = group.querySelectorAll('.server-item');
                serverItems.forEach(item => {
                    const name = item.querySelector('.server-name-input').value.trim();
                    const type = item.querySelector('.server-type-select').value;
                    const value = item.querySelector('.server-value-input').value.trim();
                    let url = '';
                    if (name && value) {
                        switch (type) {
                            case 'abyss': url = `https://short.icu/${value}`; break;
                            case 'okru': url = `//ok.ru/videoembed/${value}?nochat=1`; break;
                            case 'other': url = value; break;
                        }
                        if (url) sources[audioType].push({ name, url });
                    }
                });
            }
        });

        if (hasDuplicateAudioType) return;

        const movieData = {
            id: newId,
            title: titleInput.value.trim(),
            year: yearInput.value.trim(),
            poster: posterInput.value.trim(),
            country: countryInput.value.trim(),
            'movie-genre': genreInput.value.trim(),
            actor: actorInput.value.trim(),
            category: document.getElementById('category').value.trim(),
            age: document.getElementById('age').value.trim(),
            slide: document.getElementById('slide').value,
            description: descriptionInput.value.trim(),
            sources: sources
        };
        
        if (existingId) {
            const index = moviesData.findIndex(m => m.id === existingId);
            if (index > -1) moviesData[index] = movieData;
        } else {
            moviesData.unshift(movieData);
        }

        filterMovies();
        closeModal();
        showCustomAlert('Lưu phim thành công!', 'success');
    }
    
    function addSourceTypeToForm(audioType = 'Lồng Tiếng', servers = []) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'source-type-group';
        
        groupDiv.innerHTML = `
            <div class="source-type-header">
                <select class="audio-type-select">
                    <option value="Lồng Tiếng" ${audioType === 'Lồng Tiếng' ? 'selected' : ''}>Lồng Tiếng</option>
                    <option value="Thuyết Minh" ${audioType === 'Thuyết Minh' ? 'selected' : ''}>Thuyết Minh</option>
                    <option value="Vietsub" ${audioType === 'Vietsub' ? 'selected' : ''}>Vietsub</option>
                </select>
                <button type="button" class="remove-btn remove-type-btn">×</button>
            </div>
            <div class="servers-list"></div>
            <button type="button" class="action-btn add-server-btn" style="font-size: 0.8rem; padding: 5px 10px;"><i class="fas fa-plus"></i> Thêm Server</button>
        `;
        
        sourcesContainer.appendChild(groupDiv);
        
        const serversList = groupDiv.querySelector('.servers-list');
        if (servers.length > 0) {
            servers.forEach(server => addServerToForm(serversList, server.name, server.url));
        } else {
            addServerToForm(serversList);
        }
    }

    function parseUrl(url = '') {
        if (url.startsWith('https://short.icu/')) return { type: 'abyss', value: url.substring('https://short.icu/'.length) };
        if (url.startsWith('//ok.ru/videoembed/')) {
            const end = url.indexOf('?');
            const start = '//ok.ru/videoembed/'.length;
            const id = end > -1 ? url.substring(start, end) : url.substring(start);
            return { type: 'okru', value: id };
        }
        return { type: 'other', value: url };
    }

    function updateFullLinkDisplay(serverItemDiv) {
        const typeSelect = serverItemDiv.querySelector('.server-type-select');
        const valueInput = serverItemDiv.querySelector('.server-value-input');
        const fullLinkDisplay = serverItemDiv.querySelector('.server-full-link-display');
        
        const type = typeSelect.value;
        const value = valueInput.value.trim();
        let fullUrl = '';

        if (value) {
            switch (type) {
                case 'abyss': fullUrl = `https://short.icu/${value}`; break;
                case 'okru': fullUrl = `//ok.ru/videoembed/${value}?nochat=1`; break;
                case 'other': fullUrl = value; break;
            }
        }
        fullLinkDisplay.textContent = fullUrl ? `Link đầy đủ: ${fullUrl}` : '';
    }

    function addServerToForm(serversListEl, name = '', url = '') {
        const serverDiv = document.createElement('div');
        serverDiv.className = 'server-item';
    
        const parsed = parseUrl(url);
        const placeholder = parsed.type === 'other' ? 'Nhập link đầy đủ' : 'Nhập ID phim';
    
        serverDiv.innerHTML = `
            <div class="server-inputs">
                <select class="server-name-input">
                    <option value="Server 1">Server 1</option>
                    <option value="Server 2">Server 2</option>
                    <option value="Server 3">Server 3</option>
                    <option value="Server 4">Server 4</option>
                </select>
                <select class="server-type-select">
                    <option value="abyss" ${parsed.type === 'abyss' ? 'selected' : ''}>abyss</option>
                    <option value="okru" ${parsed.type === 'okru' ? 'selected' : ''}>okru</option>
                    <option value="other" ${parsed.type === 'other' ? 'selected' : ''}>Khác</option>
                </select>
                <input type="text" placeholder="${placeholder}" class="server-value-input" value="${parsed.value}">
                <button type="button" class="remove-btn remove-server-btn">×</button>
            </div>
            <div class="server-full-link-display"></div>
        `;
        serversListEl.appendChild(serverDiv);
    
        if (name) {
            serverDiv.querySelector('.server-name-input').value = name;
        }
    
        const typeSelect = serverDiv.querySelector('.server-type-select');
        const valueInput = serverDiv.querySelector('.server-value-input');
        
        const eventHandler = () => updateFullLinkDisplay(serverDiv);
    
        typeSelect.addEventListener('change', (e) => {
            valueInput.placeholder = e.target.value === 'other' ? 'Nhập link đầy đủ' : 'Nhập ID phim';
            valueInput.value = '';
            eventHandler();
        });
        valueInput.addEventListener('input', eventHandler);
    
        updateFullLinkDisplay(serverDiv);
    }

    async function generateAndDownloadFile() {
        const confirmed = await showCustomAlert('Hành động này sẽ tạo file data.js mới?', 'confirm');
        if (!confirmed) return;
        
        const fileContent = `const MOVIES_DATA = ${JSON.stringify(moviesData, null, 4)};`;
        const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'data.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showCustomAlert('File data.js đã được tạo. Vui lòng thay thế file cũ trên máy chủ.', 'success');
    }
    
    async function fetchAndFillMovieData() {
        const title = titleInput.value.trim();
        const year = yearInput.value.trim();
        if (!title || !year) {
            showCustomAlert('Vui lòng nhập Tiêu đề và Năm sản xuất.', 'error');
            return;
        }
        autofillLoader.style.display = 'block';
        autofillBtn.disabled = true;
        
        const apiKey = await getApiKey();
        if (!apiKey) {
            showCustomAlert("Lỗi: Không thể lấy được API key từ file api.txt.", 'error');
            autofillLoader.style.display = 'none';
            autofillBtn.disabled = false;
            return;
        }

        const prompt = `Cung cấp thông tin chi tiết cho bộ phim tên là '${title}' sản xuất năm ${year}. Trả về dữ liệu dưới dạng JSON với các trường sau: "country", "genres", "actors", và "description".`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "country": { "type": "STRING" }, "genres": { "type": "STRING" }, "actors": { "type": "STRING" }, "description": { "type": "STRING" } }, required: ["country", "genres", "actors", "description"] } } };
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                let errorMessage = `API call failed with status: ${response.status}`;
                if (errorBody && errorBody.error && errorBody.error.message) errorMessage += `\nMessage: ${errorBody.error.message}`;
                throw new Error(errorMessage);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const movieInfo = JSON.parse(result.candidates[0].content.parts[0].text);
                countryInput.value = movieInfo.country || '';
                genreInput.value = movieInfo.genres || '';
                actorInput.value = movieInfo.actors || '';
                descriptionInput.value = movieInfo.description || '';
                showCustomAlert('Đã tự động điền thông tin phim!', 'success');
            } else {
                throw new Error('Không nhận được dữ liệu hợp lệ từ API.');
            }
        } catch (error) {
            console.error('LỖI CHI TIẾT:', error);
            let userMessage = 'Đã xảy ra lỗi khi lấy thông tin phim.';
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) userMessage = 'Lỗi Mạng hoặc CORS. Kiểm tra Console (F12).';
            else if (error.message.includes('API key not valid')) userMessage = 'Lỗi: API Key không hợp lệ.';
            else if (error.message.includes('429')) userMessage = 'Lỗi: Vượt quá hạn ngạch API.';
            showCustomAlert(userMessage, 'error');
        } finally {
            autofillLoader.style.display = 'none';
            autofillBtn.disabled = false;
        }
    }

    function filterMovies() {
        const query = searchInput.value.trim();
        const normalizedQuery = removeVietnameseTones(query.toLowerCase());
        currentFilteredMovies = (normalizedQuery === '') ? [...moviesData] : moviesData.filter(m => removeVietnameseTones(m.title.toLowerCase()).includes(normalizedQuery));
        displayPage(1);
    }

    function setupSearchAndHeader() {
        const header = document.querySelector('header');
        if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
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
                }
            });
            document.addEventListener('click', (e) => {
                if (!searchGroup.contains(e.target) && searchInput.value === '') {
                    searchGroup.classList.remove('active');
                    headerContainer.classList.remove('search-active');
                }
            });
            searchInput.addEventListener('input', filterMovies);
        }
    }

    function handlePassword() {
        // Luôn hiển thị form đăng nhập và ẩn nội dung chính khi bắt đầu
        passwordOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
    
        const usernameInput = document.getElementById('username-input');
    
        // Sử dụng một hàm có tên để có thể gỡ bỏ listener sau khi đăng nhập thành công
        const loginSubmitHandler = (e) => {
            e.preventDefault();
            
            // Kiểm tra thông tin đăng nhập
            if (usernameInput.value === CORRECT_USERNAME && passwordInput.value === CORRECT_PASSWORD) {
                // Ẩn form đăng nhập và hiện nội dung chính
                passwordOverlay.style.display = 'none';
                mainContent.style.display = 'block';
    
                // Khởi tạo các chức năng của trang chính
                initializePage();
    
                // Gỡ bỏ event listener của form để tránh việc submit lại không cần thiết
                passwordForm.removeEventListener('submit', loginSubmitHandler);
            } else {
                passwordError.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
                passwordInput.value = '';
                usernameInput.focus();
            }
        };
    
        // Gán event listener cho form
        passwordForm.addEventListener('submit', loginSubmitHandler);
    }

    function initializePage() {
        titleInput.addEventListener('input', autoUpdateGeneratedFields);
        yearInput.addEventListener('input', autoUpdateGeneratedFields);
        idInput.addEventListener('input', () => {
            if (!idInput.readOnly) {
                const currentId = idInput.value.trim();
                posterInput.value = currentId ? `img/${currentId}.webp` : '';
            }
        });
        autofillBtn.addEventListener('click', fetchAndFillMovieData);
        addNewMovieBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });
        movieListEl.addEventListener('click', (e) => {
            const checkBtn = e.target.closest('.check-btn');
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            if (checkBtn) window.open(`watch.html?id=${checkBtn.dataset.id}`, '_blank');
            if (editBtn) openModal(editBtn.dataset.id);
            if (deleteBtn) deleteMovie(deleteBtn.dataset.id);
        });
        editForm.addEventListener('submit', saveMovie);
        downloadBtn.addEventListener('click', generateAndDownloadFile);
        addSourceTypeBtn.addEventListener('click', () => addSourceTypeToForm());
        sourcesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-server-btn')) addServerToForm(e.target.previousElementSibling);
            if (e.target.classList.contains('remove-server-btn')) e.target.closest('.server-item').remove();
            if (e.target.classList.contains('remove-type-btn')) e.target.closest('.source-type-group').remove();
        });
        displayPage(1);
        setupSearchAndHeader();
    }

    // --- Initial Load ---
    // Chỉ gọi handlePassword để bắt đầu quá trình, không gọi initializePage ở đây nữa
    handlePassword();
});