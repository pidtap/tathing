// update.js - PHIÊN BẢN HOÀN CHỈNH - LƯU TRẠNG THÁI ĐĂNG NHẬP
document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // CẤU HÌNH VÀ BIẾN TOÀN CỤC
    // =================================================================
    const CORRECT_USERNAME = "admin";
    const CORRECT_PASSWORD = "12346";

    let sessionApiKey = localStorage.getItem('userApiKey'); 

    let moviesData = []; 
    let currentFilteredMovies = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 20;

    // DOM Elements
    const passwordOverlay = document.getElementById('password-overlay');
    const mainContent = document.getElementById('main-content');
    const passwordForm = document.getElementById('password-form');
    const apiKeyOverlay = document.getElementById('api-key-overlay');
    const apiKeyForm = document.getElementById('api-key-form');
    const alertOverlay = document.getElementById('custom-alert-overlay');
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
    const autofillBtn = document.getElementById('autofill-btn');
    const searchInput = document.getElementById('search-input');
    const clearDraftBtn = document.getElementById('clear-draft-btn');
    // const resetDataBtn = document.getElementById('reset-data-btn'); // Nút này đã bị xóa
    const idInput = document.getElementById('id');
    const titleInput = document.getElementById('title');
    const yearInput = document.getElementById('year');
    const posterInput = document.getElementById('poster');
    const countryInput = document.getElementById('country');
    const actorInput = document.getElementById('actor');
    const genreInput = document.getElementById('movie-genre');
    const descriptionInput = document.getElementById('description');
    const autofillLoader = document.getElementById('autofill-loader');
    const apiKeyError = document.getElementById('api-key-error');
    const apiKeyInput = document.getElementById('api-key-input');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertIcon = document.getElementById('custom-alert-icon');
    const alertBox = document.getElementById('custom-alert-box');
    const alertConfirmBtn = document.getElementById('custom-alert-confirm-btn');
    const alertCancelBtn = document.getElementById('custom-alert-cancel-btn');
    const passwordError = document.getElementById('password-error');
    const passwordInput = document.getElementById('password-input');

    // === KHỐI LƯU TRỮ DANH SÁCH PHIM ===
    function persistMoviesToStorage() {
        localStorage.setItem('movieManagerData', JSON.stringify(moviesData));
        updateMovieCount();
    }

    function initializeData() {
        const storedData = localStorage.getItem('movieManagerData');
        if (storedData) {
            moviesData = JSON.parse(storedData);
        } else {
            moviesData = JSON.parse(JSON.stringify(MOVIES_DATA));
        }
        filterMovies();
    }
    
    // === KHỐI LƯU BẢN NHÁP FORM ===
    function saveMovieDraft() {
        if (document.getElementById('movie-id-input').value) return;
        const sources = {};
        sourcesContainer.querySelectorAll('.source-type-group').forEach(group => {
            const audioType = group.querySelector('.audio-type-select').value;
            if (audioType) {
                if (!sources[audioType]) sources[audioType] = [];
                group.querySelectorAll('.server-item').forEach(item => {
                    sources[audioType].push({
                        name: item.querySelector('.server-name-input').value,
                        type: item.querySelector('.server-type-select').value,
                        value: item.querySelector('.server-value-input').value,
                    });
                });
            }
        });
        const draftData = {
            title: titleInput.value, year: yearInput.value, id: idInput.value,
            poster: posterInput.value, country: countryInput.value, 'movie-genre': genreInput.value,
            actor: actorInput.value, category: document.getElementById('category').value,
            age: document.getElementById('age').value, slide: document.getElementById('slide').value,
            description: descriptionInput.value, sources: sources
        };
        localStorage.setItem('unsavedMovieData', JSON.stringify(draftData));
    }

    function loadMovieDraft() {
        const draftDataJSON = localStorage.getItem('unsavedMovieData');
        if (!draftDataJSON) return;
        const draftData = JSON.parse(draftDataJSON);
        editForm.reset(); sourcesContainer.innerHTML = '';
        titleInput.value = draftData.title || ''; yearInput.value = draftData.year || '';
        idInput.value = draftData.id || ''; posterInput.value = draftData.poster || '';
        countryInput.value = draftData.country || ''; genreInput.value = draftData['movie-genre'] || '';
        actorInput.value = draftData.actor || ''; document.getElementById('category').value = draftData.category || 'phim-le';
        document.getElementById('age').value = draftData.age || ''; document.getElementById('slide').value = draftData.slide || '0';
        descriptionInput.value = draftData.description || '';
        if (draftData.sources) {
            for (const audioType in draftData.sources) {
                addSourceTypeToForm(audioType, []);
                const serversListEl = sourcesContainer.lastChild.querySelector('.servers-list');
                serversListEl.innerHTML = '';
                draftData.sources[audioType].forEach(server => {
                    const fullUrl = parseServerToUrl(server);
                    addServerToForm(serversListEl, server.name, fullUrl);
                });
            }
        }
        clearDraftBtn.style.display = 'inline-block';
    }
    
    function parseServerToUrl(server) {
        let url = '';
        if (server.name && server.value) {
            switch (server.type) {
                case 'abyss': url = `https://short.icu/${server.value}`; break;
                case 'okru': url = `//ok.ru/videoembed/${server.value}?nochat=1`; break;
                case 'other': url = server.value; break;
            }
        }
        return url;
    }

    // === HÀM GIAO DIỆN TÙY CHỈNH ===
    function showCustomAlert(message, type = 'success') {
        return new Promise((resolve) => {
            alertMessage.innerHTML = message;
            alertIcon.className = ''; alertBox.style.borderColor = '';
            switch (type) {
                case 'error':
                    alertIcon.innerHTML = '<i class="fas fa-times-circle"></i>'; alertIcon.className = 'error';
                    alertBox.style.borderColor = '#dc3545'; alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'Đóng'; break;
                case 'confirm':
                    alertIcon.innerHTML = '<i class="fas fa-question-circle"></i>'; alertIcon.className = 'confirm';
                    alertBox.style.borderColor = 'var(--color-accent-hover)'; alertCancelBtn.style.display = 'inline-block';
                    alertConfirmBtn.innerText = 'Xác nhận'; break;
                default:
                    alertIcon.innerHTML = '<i class="fas fa-check-circle"></i>'; alertIcon.className = 'success';
                    alertBox.style.borderColor = '#28a745'; alertCancelBtn.style.display = 'none';
                    alertConfirmBtn.innerText = 'OK'; break;
            }
            alertOverlay.classList.add('visible');
            alertConfirmBtn.onclick = () => { alertOverlay.classList.remove('visible'); resolve(true); };
            alertCancelBtn.onclick = () => { alertOverlay.classList.remove('visible'); resolve(false); };
        });
    }

    // === CÁC HÀM TIỆN ÍCH KHÁC ===
    function removeVietnameseTones(str) {
        if (!str) return '';
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e"); str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u"); str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d"); str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E"); str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U"); str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        return str;
    }

    function generateSlug(title, year) {
        if (!title) return '';
        let slug = removeVietnameseTones(title).toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
        if (year.trim()) slug = `${slug}-${year.trim()}`;
        return slug;
    }

    function autoUpdateGeneratedFields() {
        if (!idInput.readOnly) {
            const generatedId = generateSlug(titleInput.value, yearInput.value);
            idInput.value = generatedId;
            idInput.dispatchEvent(new Event('input'));
        }
    }

    // === CÁC HÀM XỬ LÝ CHÍNH ===
    function filterMovies() {
        const query = searchInput.value.trim();
        const normalizedQuery = removeVietnameseTones(query.toLowerCase());
        currentFilteredMovies = (normalizedQuery === '') ? [...moviesData] : moviesData.filter(m => 
            removeVietnameseTones(m.title.toLowerCase()).includes(normalizedQuery) ||
            m.id.toLowerCase().includes(normalizedQuery)
        );
        displayPage(1);
    }

    function updateMovieCount() {
        if (!movieCountDisplay) return;
        const filteredCount = currentFilteredMovies.length;
        const totalCount = moviesData.length;
        const isUnsaved = localStorage.getItem('movieManagerData') !== null;
        const status = isUnsaved ? '<span style="color: #ffc107;">(Có thay đổi chưa lưu)</span>' : '<span style="color: #28a745;">(Đã đồng bộ)</span>';
        if (filteredCount === totalCount) {
            movieCountDisplay.innerHTML = `Tổng số: ${totalCount} phim. ${status}`;
        } else {
            movieCountDisplay.innerHTML = `Tìm thấy ${filteredCount} / ${totalCount} phim. ${status}`;
        }
    }

    function displayPage(page) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = page; movieListEl.innerHTML = '';
        const paginatedItems = currentFilteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        paginatedItems.forEach(movie => {
            const movieEl = document.createElement('div');
            movieEl.className = 'movie-list-item';
            movieEl.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/60x90/333/ccc?text=No+Img';">
                <div class="movie-list-info"><h3>${movie.title}</h3><p>ID: ${movie.id} | Năm: ${movie.year}</p></div>
                <div class="movie-list-actions">
                    <button class="check-btn" data-id="${movie.id}"><i class="fas fa-eye"></i> Kiểm tra</button>
                    <button class="edit-btn" data-id="${movie.id}"><i class="fas fa-edit"></i> Sửa</button>
                    <button class="delete-btn" data-id="${movie.id}"><i class="fas fa-trash"></i> Xóa</button>
                </div>`;
            movieListEl.appendChild(movieEl);
        });
        renderPaginationControls();
        updateMovieCount();
    }
    
    function renderPaginationControls() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredMovies.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) return;
        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.innerHTML = text; button.disabled = disabled;
            button.addEventListener('click', () => displayPage(page));
            return button;
        };
        paginationContainer.appendChild(createButton('«', currentPage - 1, currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createButton(i, i);
            if (i === currentPage) pageButton.classList.add('active');
            paginationContainer.appendChild(pageButton);
        }
        paginationContainer.appendChild(createButton('»', currentPage + 1, currentPage === totalPages));
    }
    
    async function openModal(movieId = null) {
        clearDraftBtn.style.display = 'none';
        sourcesContainer.innerHTML = '';
        if (movieId) {
            editForm.reset();
            const movie = moviesData.find(m => m.id === movieId);
            if (movie) {
                document.getElementById('modal-title').textContent = 'Sửa thông tin phim';
                document.getElementById('movie-id-input').value = movie.id;
                idInput.value = movie.id; titleInput.value = movie.title || ''; yearInput.value = movie.year || '';
                posterInput.value = movie.poster || ''; countryInput.value = movie.country || '';
                genreInput.value = movie['movie-genre'] || ''; actorInput.value = movie.actor || '';
                document.getElementById('category').value = movie.category || 'phim-le';
                document.getElementById('age').value = movie.age || ''; document.getElementById('slide').value = movie.slide || '0';
                descriptionInput.value = movie.description || '';
                if (movie.sources && typeof movie.sources === 'object') {
                    for (const audioType in movie.sources) {
                        addSourceTypeToForm(audioType, movie.sources[audioType]);
                    }
                }
            }
        } else {
            document.getElementById('modal-title').textContent = 'Thêm phim mới';
            document.getElementById('movie-id-input').value = ''; idInput.readOnly = false;
            const draftDataJSON = localStorage.getItem('unsavedMovieData');
            if (draftDataJSON) {
                const restore = await showCustomAlert('Phát hiện có một bản nháp chưa lưu. Bạn có muốn khôi phục không?', 'confirm');
                if (restore) { loadMovieDraft(); }
                else { localStorage.removeItem('unsavedMovieData'); editForm.reset(); }
            } else { editForm.reset(); }
        }
        modal.style.display = 'block';
    }

    function closeModal() { modal.style.display = 'none'; }

    async function saveMovie(e) {
        e.preventDefault();
        const existingId = document.getElementById('movie-id-input').value;
        const newId = idInput.value.trim();
        
        if (!newId) {
            return showCustomAlert('ID phim là bắt buộc!', 'error');
        }
        
        const isCreating = !existingId;

        // CHỈ KIỂM TRA NẾU ID PHIM ĐÃ TỒN TẠI KHI THÊM MỚI
        if (isCreating && moviesData.some(m => m.id === newId)) {
            return showCustomAlert(`ID phim "${newId}" đã tồn tại. Vui lòng tạo một ID khác.`, 'error');
        }

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
            sources: {}
        };
        sourcesContainer.querySelectorAll('.source-type-group').forEach(group => {
            const audioType = group.querySelector('.audio-type-select').value;
            if (audioType) {
                movieData.sources[audioType] = [];
                group.querySelectorAll('.server-item').forEach(item => {
                    const name = item.querySelector('.server-name-input').value.trim();
                    const type = item.querySelector('.server-type-select').value;
                    const value = item.querySelector('.server-value-input').value.trim();
                    let url = '';
                    if (name && value) {
                        switch (type) {
                            case 'abyss':
                                url = `https://short.icu/${value}`;
                                break;
                            case 'okru':
                                url = `//ok.ru/videoembed/${value}?nochat=1`;
                                break;
                            case 'other':
                                url = value;
                                break;
                        }
                        if (url) movieData.sources[audioType].push({
                            name,
                            url
                        });
                    }
                });
            }
        });

        if (isCreating) {
            // Bây giờ, phim sẽ được thêm trực tiếp nếu ID hợp lệ
            moviesData.unshift(movieData);
            localStorage.removeItem('unsavedMovieData');
        } else {
            const index = moviesData.findIndex(m => m.id === existingId);
            if (index > -1) moviesData[index] = movieData;
        }

        persistMoviesToStorage();
        filterMovies();
        closeModal();
        showCustomAlert('Lưu phim thành công!', 'success');
    }

    async function deleteMovie(movieId) {
        const confirmed = await showCustomAlert(`Bạn có chắc muốn xóa phim ID: ${movieId}?`, 'confirm');
        if (confirmed) {
            moviesData = moviesData.filter(m => m.id !== movieId);
            persistMoviesToStorage();
            filterMovies();
            showCustomAlert('Đã xóa phim thành công!', 'success');
        }
    }
    
    function addSourceTypeToForm(audioType = 'Lồng Tiếng', servers = []) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'source-type-group';
        groupDiv.innerHTML = `
            <div class="source-type-header"><select class="audio-type-select">
                <option value="Lồng Tiếng" ${audioType === 'Lồng Tiếng' ? 'selected' : ''}>Lồng Tiếng</option>
                <option value="Thuyết Minh" ${audioType === 'Thuyết Minh' ? 'selected' : ''}>Thuyết Minh</option>
                <option value="Vietsub" ${audioType === 'Vietsub' ? 'selected' : ''}>Vietsub</option>
            </select><button type="button" class="remove-btn remove-type-btn">×</button></div>
            <div class="servers-list"></div>
            <button type="button" class="action-btn add-server-btn" style="font-size: 0.8rem; padding: 5px 10px;"><i class="fas fa-plus"></i> Thêm Server</button>`;
        sourcesContainer.appendChild(groupDiv);
        const serversList = groupDiv.querySelector('.servers-list');
        if (servers.length > 0) { servers.forEach(server => addServerToForm(serversList, server.name, server.url)); }
        else { addServerToForm(serversList); }
    }

    function parseUrl(url = '') {
        if (url.startsWith('https://short.icu/')) return { type: 'abyss', value: url.substring(20) };
        if (url.startsWith('//ok.ru/videoembed/')) return { type: 'okru', value: url.split('/')[4].split('?')[0] };
        return { type: 'other', value: url };
    }

    function updateFullLinkDisplay(serverItemDiv) {
        const type = serverItemDiv.querySelector('.server-type-select').value;
        const value = serverItemDiv.querySelector('.server-value-input').value.trim();
        const display = serverItemDiv.querySelector('.server-full-link-display');
        let fullUrl = '';
        if (value) {
            switch (type) {
                case 'abyss': fullUrl = `https://short.icu/${value}`; break;
                case 'okru': fullUrl = `//ok.ru/videoembed/${value}?nochat=1`; break;
                case 'other': fullUrl = value; break;
            }
        }
        display.textContent = fullUrl ? `Link đầy đủ: ${fullUrl}` : '';
    }

    function addServerToForm(serversListEl, name = '', url = '') {
        const serverDiv = document.createElement('div');
        serverDiv.className = 'server-item';
        const parsed = parseUrl(url);
        serverDiv.innerHTML = `
            <div class="server-inputs">
                <select class="server-name-input"><option value="Server 1">Server 1</option><option value="Server 2">Server 2</option><option value="Server 3">Server 3</option><option value="Server 4">Server 4</option></select>
                <select class="server-type-select">
                    <option value="abyss" ${parsed.type === 'abyss' ? 'selected' : ''}>abyss</option>
                    <option value="okru" ${parsed.type === 'okru' ? 'selected' : ''}>okru</option>
                    <option value="other" ${parsed.type === 'other' ? 'selected' : ''}>Khác</option>
                </select>
                <input type="text" placeholder="${parsed.type === 'other' ? 'Nhập link đầy đủ' : 'Nhập ID phim'}" class="server-value-input" value="${parsed.value}">
                <button type="button" class="remove-btn remove-server-btn">×</button>
            </div><div class="server-full-link-display"></div>`;
        serversListEl.appendChild(serverDiv);
        if (name) serverDiv.querySelector('.server-name-input').value = name;
        serverDiv.querySelector('.server-type-select').addEventListener('change', () => updateFullLinkDisplay(serverDiv));
        serverDiv.querySelector('.server-value-input').addEventListener('input', () => updateFullLinkDisplay(serverDiv));
        updateFullLinkDisplay(serverDiv);
    }
    
    async function fetchAndFillMovieData() {
    if (!titleInput.value.trim() || !yearInput.value.trim()) {
        return showCustomAlert('Vui lòng nhập Tiêu đề và Năm sản xuất.', 'error');
    }
    if (!sessionApiKey) {
        apiKeyError.textContent = '';
        apiKeyOverlay.style.display = 'flex';
        apiKeyInput.focus();
        return;
    }
    autofillLoader.style.display = 'block';
    autofillBtn.disabled = true;

    // Prompt đã được cải tiến để AI hiểu rõ yêu cầu và trả về kết quả chính xác hơn
    const prompt = `Hãy tìm thông tin chính xác nhất cho bộ phim điện ảnh có tên "${titleInput.value.trim()}" sản xuất vào năm ${yearInput.value.trim()}.
Nếu có nhiều phim trùng tên, hãy ưu tiên kết quả khớp chính xác nhất với năm sản xuất.
Chỉ trả về dữ liệu dưới dạng một đối tượng JSON duy nhất, không có giải thích hay định dạng markdown.
Các trường bắt buộc là: "country" (quốc gia), "genres" (thể loại, cách nhau bởi dấu phẩy), "actors" (diễn viên chính tối đa 5, cách nhau bởi dấu phẩy), và "description" (mô tả khoảng 10 dòng văn bản).
YÊU CẦU QUAN TRỌNG: Giá trị của các tất cả trường PHẢI LÀ TIẾNG VIỆT.`;

    const payload = {
        contents: [{
            role: "user",
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "country": {
                        "type": "STRING"
                    },
                    "genres": {
                        "type": "STRING"
                    },
                    "actors": {
                        "type": "STRING"
                    },
                    "description": {
                        "type": "STRING"
                    }
                },
                required: ["country", "genres", "actors", "description"]
            }
        }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${sessionApiKey}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        const result = await response.json();
        const movieInfo = JSON.parse(result.candidates[0].content.parts[0].text);
        countryInput.value = movieInfo.country || '';
        genreInput.value = movieInfo.genres || '';
        actorInput.value = movieInfo.actors || '';
        descriptionInput.value = movieInfo.description || '';
        showCustomAlert('Đã tự động điền thông tin phim!', 'success');
    } catch (error) {
        console.error('LỖI CHI TIẾT:', error);
        showCustomAlert('Đã xảy ra lỗi khi lấy thông tin phim. Vui lòng kiểm tra API Key và thử lại.', 'error');
    } finally {
        autofillLoader.style.display = 'none';
        autofillBtn.disabled = false;
    }
}

    async function generateAndDownloadFile() {
        const confirmed = await showCustomAlert('Hành động này sẽ tạo file data.js mới. Sau khi tải về, các thay đổi tạm thời sẽ được xóa để đồng bộ. Tiếp tục?', 'confirm');
        if (confirmed) {
            const fileContent = `const MOVIES_DATA = ${JSON.stringify(moviesData, null, 4)};`;
            const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = 'data.js';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            localStorage.removeItem('movieManagerData');
            showCustomAlert('File data.js đã được tạo thành công!', 'success').then(() => updateMovieCount());
        }
    }

    function setupSearchAndHeader() {
        const searchInput = document.getElementById('search-input');
        const searchGroup = document.querySelector('.search-group');
        const searchBtn = document.getElementById('search-btn');
        const headerContainer = document.querySelector('.header-container');

        if (searchGroup && searchInput && searchBtn && headerContainer) {
            // Sự kiện khi nhấn vào nút search
            searchBtn.addEventListener('click', (e) => {
                // Nếu ô search chưa mở, thì mở nó ra
                if (!searchGroup.classList.contains('active')) {
                    e.preventDefault(); // Ngăn hành vi mặc định
                    searchGroup.classList.add('active');
                    headerContainer.classList.add('search-active');
                    searchInput.focus();
                }
                // Nếu đã mở thì không làm gì cả, vì chức năng tìm kiếm đã được xử lý bởi sự kiện 'input'
            });

            // Sự kiện khi nhấn ra ngoài ô search
            document.addEventListener('click', (e) => {
                // Nếu click ra ngoài và ô search trống thì thu nhỏ lại
                if (!searchGroup.contains(e.target) && searchInput.value === '') {
                    searchGroup.classList.remove('active');
                    headerContainer.classList.remove('search-active');
                }
            });
        }
    }

    // === KHỞI TẠO TRANG ===
    function initializePage() {
        idInput.addEventListener('input', () => { if (!idInput.readOnly) posterInput.value = idInput.value ? `img/${idInput.value}.webp` : ''; });
        titleInput.addEventListener('input', autoUpdateGeneratedFields);
        yearInput.addEventListener('input', autoUpdateGeneratedFields);
        apiKeyForm.addEventListener('submit', (e) => {
            e.preventDefault(); const key = apiKeyInput.value.trim();
            if (key) { localStorage.setItem('userApiKey', key); sessionApiKey = key; apiKeyOverlay.style.display = 'none'; fetchAndFillMovieData(); } 
            else { apiKeyError.textContent = 'Vui lòng nhập một API key hợp lệ.'; }
        });
        editForm.addEventListener('input', saveMovieDraft);
        clearDraftBtn.addEventListener('click', () => {
            showCustomAlert('Bạn có chắc muốn xóa bản nháp của form này?', 'confirm').then(confirmed => {
                if (confirmed) { localStorage.removeItem('unsavedMovieData'); editForm.reset(); sourcesContainer.innerHTML = ''; clearDraftBtn.style.display = 'none'; }
            });
        });
        autofillBtn.addEventListener('click', fetchAndFillMovieData);
        addNewMovieBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        editForm.addEventListener('submit', saveMovie);
        downloadBtn.addEventListener('click', generateAndDownloadFile);
        
        searchInput.addEventListener('input', filterMovies);
        addSourceTypeBtn.addEventListener('click', () => addSourceTypeToForm());
        movieListEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('check-btn')) window.open(`watch.html?id=${id}`, '_blank');
            else if (btn.classList.contains('edit-btn')) openModal(id);
            else if (btn.classList.contains('delete-btn')) deleteMovie(id);
        });
        sourcesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.classList.contains('add-server-btn')) addServerToForm(btn.previousElementSibling);
            else if (btn.classList.contains('remove-server-btn')) btn.closest('.server-item').remove();
            else if (btn.classList.contains('remove-type-btn')) btn.closest('.source-type-group').remove();
        });
        initializeData();
        setupSearchAndHeader();
    }

    function handlePassword() {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username-input');
            if (usernameInput.value === CORRECT_USERNAME && passwordInput.value === CORRECT_PASSWORD) {
                // LƯU TRẠNG THÁI ĐĂNG NHẬP VÀO SESSIONSTORAGE
                sessionStorage.setItem('isLoggedIn', 'true');
                
                passwordOverlay.style.display = 'none';
                mainContent.style.display = 'block';
                initializePage();
            } else {
                passwordError.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
                passwordInput.value = ''; usernameInput.focus();
            }
        });
    }

    // === LOGIC KHỞI ĐỘNG TRANG CHÍNH ===
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        // Nếu đã đăng nhập, vào thẳng trang quản trị
        passwordOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        initializePage();
    } else {
        // Nếu chưa, hiển thị màn hình đăng nhập
        passwordOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
        handlePassword();
    }
});