// ============================================
// MD Card Converter Module - Fallout Edition
// ============================================
(function() {
    let allCards = [];
    let shownQueue = [];
    let currentCardId = null;
    let editCardId = null;

    function init() {
        // Привязываем события только после полной загрузки DOM
        const parseBtn = document.getElementById('parseBtn');
        if (parseBtn) parseBtn.addEventListener('click', parseMd);
        
        const nextCardBtn = document.getElementById('nextCardBtn');
        if (nextCardBtn) nextCardBtn.addEventListener('click', nextRandomCard);
        
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if (deleteAllBtn) deleteAllBtn.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.add('active');
        });
        
        const excludeAllBtn = document.getElementById('excludeAllBtn');
        if (excludeAllBtn) excludeAllBtn.addEventListener('click', toggleExcludeAll);
        
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (saveEditBtn) saveEditBtn.addEventListener('click', saveEdit);
        
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
        
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('active');
        });
        
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteAllCards);
        
        const mdFileInput = document.getElementById('mdFileInput');
        if (mdFileInput) mdFileInput.addEventListener('change', handleFileUpload);
        
        const cardsGrid = document.getElementById('cardsGrid');
        if (cardsGrid) cardsGrid.addEventListener('click', handleLibraryClick);
        
        renderLibrary();
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('mdInput').value = ev.target.result;
        };
        reader.readAsText(file);
    }

    function handleLibraryClick(e) {
        const cardEl = e.target.closest('.library-card');
        if (!cardEl) return;
        const id = cardEl.dataset.id;
        if (e.target.closest('.edit-btn')) {
            openEditModal(id);
        } else if (e.target.closest('.exclude-btn')) {
            toggleExcludeCard(id);
        } else {
            showCardInDisplay(id);
        }
    }

    // ---------- НОВЫЙ АЛГОРИТМ ПАРСИНГА ----------
    function parseMd() {
        const mdInput = document.getElementById('mdInput');
        if (!mdInput) return;
        const text = mdInput.value.trim();
        if (!text) return;
        
        const lines = text.split('\n');
        
        // Шаг 1: подсчёт заголовков каждого уровня (1..7)
        const headingCounts = {};
        for (let i = 1; i <= 7; i++) headingCounts[i] = 0;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                let level = 0;
                while (trimmed[level] === '#') level++;
                if (level >= 1 && level <= 7) {
                    headingCounts[level]++;
                }
            }
        });
        
        // Шаг 2: выбор уровня по частоте
        let maxCount = 0;
        for (let i = 1; i <= 7; i++) {
            if (headingCounts[i] > maxCount) maxCount = headingCounts[i];
        }
        
        const candidates = [];
        for (let i = 1; i <= 7; i++) {
            if (headingCounts[i] === maxCount && maxCount > 0) {
                candidates.push(i);
            }
        }
        
        let chosenLevel;
        if (candidates.length === 1) {
            chosenLevel = candidates[0];
        } else if (candidates.length > 1) {
            // Если несколько уровней имеют одинаковую частоту,
            // выбираем среднее арифметическое (округляем до ближайшего целого)
            const sum = candidates.reduce((a, b) => a + b, 0);
            chosenLevel = Math.round(sum / candidates.length);
        } else {
            // Нет ни одного заголовка – нет карточек
            return;
        }
        
        // Шаг 3: разбиваем текст по строкам выбранного уровня
        const newCards = [];
        let currentTitle = '';
        let currentDesc = [];
        
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                let level = 0;
                while (trimmed[level] === '#') level++;
                if (level === chosenLevel) {
                    // Встретили заголовок выбранного уровня – сохраняем предыдущую карточку
                    if (currentTitle) {
                        newCards.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            title: currentTitle,
                            desc: currentDesc.join(' ').trim(),
                            excluded: false
                        });
                    }
                    // Начинаем новую карточку
                    currentTitle = trimmed.replace(/^#+\s*/, '');
                    currentDesc = [];
                    continue;
                }
            }
            // Обычная строка – добавляем к описанию, если уже есть заголовок
            if (currentTitle) {
                currentDesc.push(trimmed);
            }
        }
        // Последняя карточка
        if (currentTitle) {
            newCards.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: currentTitle,
                desc: currentDesc.join(' ').trim(),
                excluded: false
            });
        }
        
        if (newCards.length) {
            allCards = [...allCards, ...newCards];
            renderLibrary();
            if (!currentCardId && allCards.length) {
                showCardInDisplay(allCards[0].id);
            }
            mdInput.value = ''; // Очищаем поле после успешного парсинга
        }
    }
    // ----------------------------------------------

    function renderLibrary() {
        const grid = document.getElementById('cardsGrid');
        const cardCount = document.getElementById('cardCount');
        if (!grid || !cardCount) return;
        cardCount.textContent = allCards.length;
        
        grid.innerHTML = allCards.map(card => `
            <div class="library-card${card.excluded ? ' excluded' : ''}" data-id="${card.id}">
                <div class="lib-card-title">${escapeHtml(card.title)}</div>
                <div class="lib-card-desc">${escapeHtml(card.desc || '')}</div>
                <div class="card-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="exclude-btn">${card.excluded ? 'Incl' : 'Excl'}</button>
                </div>
            </div>
        `).join('');
    }

    function showCardInDisplay(id) {
        const card = allCards.find(c => c.id === id);
        if (!card || card.excluded) return;
        currentCardId = id;
        const display = document.getElementById('flashcardDisplay');
        if (!display) return;
        display.innerHTML = `
            <div class="flashcard">
                <div class="flashcard-inner">
                    <div class="flashcard-front">${escapeHtml(card.title)}</div>
                    <div class="flashcard-back">${escapeHtml(card.desc || 'No description')}</div>
                </div>
            </div>
        `;
        const controls = document.getElementById('flashcardControls');
        if (controls) controls.style.display = 'flex';
        updateQueueInfo();
    }

    function nextRandomCard() {
        const available = allCards.filter(c => !c.excluded);
        if (available.length === 0) {
            const display = document.getElementById('flashcardDisplay');
            if (display) display.innerHTML = '<div class="empty-state">No cards available</div>';
            const controls = document.getElementById('flashcardControls');
            if (controls) controls.style.display = 'none';
            return;
        }

        const notShown = available.filter(c => !shownQueue.includes(c.id));
        const pool = notShown.length ? notShown : available;
        const randomCard = pool[Math.floor(Math.random() * pool.length)];
        
        shownQueue.push(randomCard.id);
        if (shownQueue.length >= available.length) {
            shownQueue = [];
        }
        showCardInDisplay(randomCard.id);
    }

    function updateQueueInfo() {
        const queueInfo = document.getElementById('queueInfo');
        if (!queueInfo) return;
        const total = allCards.filter(c => !c.excluded).length;
        queueInfo.textContent = total > 0 ? `Shown: ${shownQueue.length}/${total}` : '';
    }

    function toggleExcludeCard(id) {
        const card = allCards.find(c => c.id === id);
        if (!card) return;
        card.excluded = !card.excluded;
        if (card.excluded) {
            shownQueue = shownQueue.filter(qId => qId !== id);
            if (currentCardId === id) {
                currentCardId = null;
                const display = document.getElementById('flashcardDisplay');
                if (display) display.innerHTML = '<div class="empty-state">Card excluded</div>';
                const controls = document.getElementById('flashcardControls');
                if (controls) controls.style.display = 'none';
            }
        }
        renderLibrary();
        updateQueueInfo();
    }

    function toggleExcludeAll() {
        const btn = document.getElementById('excludeAllBtn');
        const shouldExclude = !allCards.every(c => c.excluded);
        allCards.forEach(c => c.excluded = shouldExclude);
        if (btn) btn.classList.toggle('active', shouldExclude);
        if (shouldExclude) {
            shownQueue = [];
            currentCardId = null;
            const display = document.getElementById('flashcardDisplay');
            if (display) display.innerHTML = '<div class="empty-state">All excluded</div>';
            const controls = document.getElementById('flashcardControls');
            if (controls) controls.style.display = 'none';
        }
        renderLibrary();
        updateQueueInfo();
        if (!shouldExclude && allCards.length && !currentCardId) {
            showCardInDisplay(allCards[0].id);
        }
    }

    function openEditModal(id) {
        const card = allCards.find(c => c.id === id);
        if (!card) return;
        editCardId = id;
        document.getElementById('editTitle').value = card.title;
        document.getElementById('editDesc').value = card.desc || '';
        document.getElementById('editModal').classList.add('active');
    }

    function closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        editCardId = null;
    }

    function saveEdit() {
        if (!editCardId) return;
        const card = allCards.find(c => c.id === editCardId);
        if (card) {
            card.title = document.getElementById('editTitle').value.trim() || card.title;
            card.desc = document.getElementById('editDesc').value.trim();
        }
        renderLibrary();
        if (currentCardId === editCardId) {
            showCardInDisplay(editCardId);
        }
        closeEditModal();
    }

    function deleteAllCards() {
        allCards = [];
        shownQueue = [];
        currentCardId = null;
        const btn = document.getElementById('excludeAllBtn');
        if (btn) btn.classList.remove('active');
        renderLibrary();
        const display = document.getElementById('flashcardDisplay');
        if (display) display.innerHTML = '<div class="empty-state">No cards</div>';
        const controls = document.getElementById('flashcardControls');
        if (controls) controls.style.display = 'none';
        document.getElementById('confirmModal').classList.remove('active');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Безопасный запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();