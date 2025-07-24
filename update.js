// update.js
document.addEventListener('DOMContentLoaded', () => {
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

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                displayPage(currentPage - 1);
            }
        });
        paginationContainer.appendChild(prevButton);

        // Page Number Buttons (simplified logic for now)
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                displayPage(i);
            });
            paginationContainer.appendChild(pageButton);
        }

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                displayPage(currentPage + 1);
            }
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

    function deleteMovie(movieId) {
        if (confirm(`Bạn có chắc chắn muốn xóa phim có ID: ${movieId}?`)) {
            moviesData = moviesData.filter(m => m.id !== movieId);
            // Re-filter the list after deletion
            filterMovies();
            alert('Đã xóa phim thành công!');
        }
    }

    function saveMovie(e) {
        e.preventDefault();
        const existingId = document.getElementById('movie-id-input').value;
        const newId = idInput.value.trim();
        
        if (!newId) {
            alert('ID phim là bắt buộc! Vui lòng nhập tiêu đề và năm để tạo ID.');
            return;
        }

        if (!existingId && moviesData.some(m => m.id === newId)) {
            alert(`ID phim "${newId}" đã tồn tại. Vui lòng chọn ID khác.`);
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
                    alert(`Lỗi: Loại âm thanh "${audioType}" bị trùng lặp. Vui lòng chỉ sử dụng mỗi loại một lần.`);
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
                        if (url) {
                           sources[audioType].push({ name, url });
                        }
                    }
                });
            }
        });

        if (hasDuplicateAudioType) {
            return; // Stop the save process if duplicates are found
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
            sources: sources
        };
        
        if (existingId) {
            const index = moviesData.findIndex(m => m.id === existingId);
            if (index > -1) {
                moviesData[index] = movieData;
            }
        } else {
            moviesData.unshift(movieData);
        }

        filterMovies(); // Re-filter and display
        closeModal();
        alert('Lưu phim thành công!');
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
                <button type="button" class="remove-btn remove-type-btn">&times;</button>
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
        if (url.startsWith('https://short.icu/')) {
            return { type: 'abyss', value: url.substring('https://short.icu/'.length) };
        }
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
                case 'abyss':
                    fullUrl = `https://short.icu/${value}`;
                    break;
                case 'okru':
                    fullUrl = `//ok.ru/videoembed/${value}?nochat=1`;
                    break;
                case 'other':
                    fullUrl = value;
                    break;
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
                <input type="text" placeholder="Tên Server (vd: Server 1)" class="server-name-input" value="${name}">
                <select class="server-type-select">
                    <option value="abyss" ${parsed.type === 'abyss' ? 'selected' : ''}>abyss</option>
                    <option value="okru" ${parsed.type === 'okru' ? 'selected' : ''}>okru</option>
                    <option value="other" ${parsed.type === 'other' ? 'selected' : ''}>Khác</option>
                </select>
                <input type="text" placeholder="${placeholder}" class="server-value-input" value="${parsed.value}">
                <button type="button" class="remove-btn remove-server-btn">&times;</button>
            </div>
            <div class="server-full-link-display"></div>
        `;
        serversListEl.appendChild(serverDiv);

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

    function generateAndDownloadFile() {
        if (!confirm('Hành động này sẽ tạo file data.js mới với tất cả các thay đổi hiện tại. Bạn có muốn tiếp tục?')) {
            return;
        }
        const fileContent = `const MOVIES_DATA = ${JSON.stringify(moviesData, null, 4)};`;
        const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'data.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('File data.js đã được tạo. Vui lòng thay thế file cũ trên máy chủ của bạn bằng file vừa tải về.');
    }
    
    async function fetchAndFillMovieData() {
        const title = titleInput.value.trim();
        const year = yearInput.value.trim();

        if (!title || !year) {
            alert('Vui lòng nhập Tiêu đề và Năm sản xuất trước khi lấy thông tin.');
            return;
        }

        autofillLoader.style.display = 'block';
        autofillBtn.disabled = true;

        const prompt = `Cung cấp thông tin chi tiết cho bộ phim tên là '${title}' sản xuất năm ${year}. Trả về dữ liệu dưới dạng JSON với các trường sau: "country" (quốc gia sản xuất chính, ví dụ: 'Hồng Kông'), "genres" (một chuỗi các thể loại cách nhau bởi dấu phẩy, ví dụ: 'Hành động, Hài hước'), "actors" (một chuỗi các diễn viên chính cách nhau bởi dấu phẩy), và "description" (mô tả chi tiết nội dung phim bằng tiếng Việt, dài khoảng 10 dòng).`;
        
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "country": { "type": "STRING" },
                        "genres": { "type": "STRING" },
                        "actors": { "type": "STRING" },
                        "description": { "type": "STRING" }
                    },
                    required: ["country", "genres", "actors", "description"]
                }
            }
        };
        
        const apiKey = "AIzaSyCrUTt3plrtQxXJRJWyjCtOi_Q7dBXnJWU"; 

        if (apiKey === "DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY") {
            alert("Lỗi: Vui lòng điền API Key của Google AI vào file update.js để sử dụng tính năng này.");
            autofillLoader.style.display = 'none';
            autofillBtn.disabled = false;
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                let errorMessage = `API call failed with status: ${response.status}`;
                if (errorBody && errorBody.error && errorBody.error.message) {
                    errorMessage += `\nMessage: ${errorBody.error.message}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                const movieInfo = JSON.parse(text);

                countryInput.value = movieInfo.country || '';
                genreInput.value = movieInfo.genres || '';
                actorInput.value = movieInfo.actors || '';
                descriptionInput.value = movieInfo.description || '';
                
                alert('Đã tự động điền thông tin phim!');
            } else {
                throw new Error('Không nhận được dữ liệu hợp lệ từ API. Phản hồi có thể trống.');
            }
        } catch (error) {
            console.error('LỖI CHI TIẾT KHI LẤY DỮ LIỆU PHIM:', error);
            
            let userMessage = 'Đã xảy ra lỗi khi lấy thông tin phim. Vui lòng thử lại hoặc điền thủ công.';

            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                userMessage = 'Lỗi Mạng hoặc CORS: Không thể kết nối đến máy chủ API.\n\nĐiều này thường xảy ra khi chạy file trên máy tính cục bộ. Hãy kiểm tra kết nối mạng và xem lỗi chi tiết trong Console (nhấn F12).';
            } else if (error.message.includes('API key not valid')) {
                userMessage = 'Lỗi: API Key không hợp lệ. Vui lòng kiểm tra lại key bạn đã dán trong file update.js.';
            } else if (error.message.includes('429')) {
                userMessage = 'Lỗi: Bạn đã vượt quá hạn ngạch sử dụng API. Vui lòng thử lại sau.';
            }

            alert(userMessage);
        } finally {
            autofillLoader.style.display = 'none';
            autofillBtn.disabled = false;
        }
    }

    function filterMovies() {
        const query = searchInput.value.trim();
        const normalizedQuery = removeVietnameseTones(query.toLowerCase());

        if (normalizedQuery === '') {
            currentFilteredMovies = [...moviesData];
        } else {
            currentFilteredMovies = moviesData.filter(m => {
                const normalizedTitle = removeVietnameseTones(m.title.toLowerCase());
                return normalizedTitle.includes(normalizedQuery);
            });
        }
        displayPage(1); // Go back to page 1 after filtering
    }

    // --- Search and Header Logic ---
    function setupSearchAndHeader() {
        const header = document.querySelector('header');
        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            });
        }

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


    // --- Event Listeners ---
    
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
    window.addEventListener('click', (event) => {
        if (event.target == modal) closeModal();
    });

    movieListEl.addEventListener('click', (e) => {
        const checkBtn = e.target.closest('.check-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (checkBtn) {
            const movieId = checkBtn.dataset.id;
            window.open(`watch.html?id=${movieId}`, '_blank');
        }
        if (editBtn) {
            openModal(editBtn.dataset.id);
        }
        if (deleteBtn) {
            deleteMovie(deleteBtn.dataset.id);
        }
    });

    editForm.addEventListener('submit', saveMovie);
    downloadBtn.addEventListener('click', generateAndDownloadFile);
    addSourceTypeBtn.addEventListener('click', () => addSourceTypeToForm());
    
    sourcesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-server-btn')) {
            addServerToForm(e.target.previousElementSibling);
        }
        if (e.target.classList.contains('remove-server-btn')) {
            e.target.closest('.server-item').remove();
        }
        if (e.target.classList.contains('remove-type-btn')) {
            e.target.closest('.source-type-group').remove();
        }
    });

    // --- Initial Load ---
    displayPage(1); // Initial render with pagination
    setupSearchAndHeader();
});
