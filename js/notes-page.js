// Последняя вкладка сайта: заметки со списком, редактором и календарем
(function() {
    class Note {
        constructor(id, title, content, tags, date, pinned = false) {
            this.id = id;
            this.title = title;
            this.content = content;
            this.tags = tags;
            this.date = date;
            this.pinned = pinned;
            this.createdAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
        }
    }

    class NotesManager {
        constructor() {
            this.notes = [];
            this.selectedNoteId = null;
            this.searchTerm = '';
            this.selectedTag = null;
            this.currentCalendarDate = new Date(2026, 5, 1);

            if (!document.getElementById('page-notes')) return;

            this.loadFromStorage();
            this.loadSampleData();
            this.render();
            this.bindEvents();
        }

        loadSampleData() {
            if (this.notes.length > 0) return;

            this.notes.push(
                new Note(Date.now(), 'План проекта', 'Завершить разработку модуля авторизации и интегрировать с базой данных', ['работа', 'важное'], '2026-05-13', true),
                new Note(Date.now() + 1, 'Купить продукты', 'Молоко, хлеб, яйца, овощи, фрукты', ['личное', 'покупки'], '2026-05-15', false),
                new Note(Date.now() + 2, 'Идеи для приложения', 'Добавить темную тему, улучшить производительность, добавить экспорт в PDF', ['идеи', 'разработка'], '2026-05-17', false),
                new Note(Date.now() + 3, 'Встреча с командой', 'Обсудить спринт, распределить задачи, провести ретроспективу', ['работа', 'встреча'], '2026-05-20', true)
            );
            this.saveToStorage();
        }

        saveToStorage() {
            localStorage.setItem('pipboy_notes', JSON.stringify(this.notes));
        }

        loadFromStorage() {
            const stored = localStorage.getItem('pipboy_notes');
            this.notes = stored ? JSON.parse(stored) : [];
        }

        addNote(note) {
            this.notes.push(note);
            this.saveToStorage();
            this.render();
        }

        updateNote(id, updatedNote) {
            const index = this.notes.findIndex(note => note.id == id);
            if (index === -1) return;

            this.notes[index] = { ...updatedNote, updatedAt: new Date().toISOString() };
            this.saveToStorage();
            this.render();
        }

        deleteNote(id) {
            this.notes = this.notes.filter(note => note.id != id);
            if (this.selectedNoteId == id) {
                this.selectedNoteId = null;
                this.clearForm();
            }
            this.saveToStorage();
            this.render();
        }

        getFilteredNotes() {
            let filtered = [...this.notes];

            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                filtered = filtered.filter(note =>
                    note.title.toLowerCase().includes(term) ||
                    note.content.toLowerCase().includes(term)
                );
            }

            if (this.selectedTag) {
                filtered = filtered.filter(note => note.tags.includes(this.selectedTag));
            }

            return filtered.sort((a, b) => {
                if (a.pinned !== b.pinned) return b.pinned - a.pinned;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
        }

        getAllTags() {
            const tags = new Set();
            this.notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
            return Array.from(tags).sort();
        }

        getNotesByDate(date) {
            return this.notes.filter(note => note.date === date);
        }

        bindEvents() {
            document.getElementById('searchInput').addEventListener('input', event => {
                this.searchTerm = event.target.value;
                this.renderNotesList();
            });

            document.getElementById('newNoteBtn').addEventListener('click', () => {
                this.selectedNoteId = null;
                this.clearForm();
            });

            document.getElementById('saveBtn').addEventListener('click', () => this.saveCurrentNote());

            document.getElementById('deleteBtn').addEventListener('click', () => {
                if (this.selectedNoteId && confirm('Удалить эту заметку?')) {
                    this.deleteNote(this.selectedNoteId);
                }
            });

            document.getElementById('pinBtn').addEventListener('click', () => {
                if (!this.selectedNoteId) return;
                const note = this.notes.find(item => item.id == this.selectedNoteId);
                if (!note) return;

                note.pinned = !note.pinned;
                this.saveToStorage();
                this.render();
            });

            document.getElementById('prevBtn').addEventListener('click', () => this.selectSiblingNote(-1));
            document.getElementById('nextBtn').addEventListener('click', () => this.selectSiblingNote(1));

            document.getElementById('calendarPrev').addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                this.renderCalendar();
            });

            document.getElementById('calendarNext').addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                this.renderCalendar();
            });

            document.getElementById('notesList').addEventListener('click', event => {
                const card = event.target.closest('.notes-note-card');
                if (card) this.selectNote(card.dataset.id);
            });

            document.getElementById('tagsFilter').addEventListener('click', event => {
                const chip = event.target.closest('.notes-tag-chip');
                if (!chip) return;
                this.setSelectedTag(chip.dataset.tag || null);
            });

            document.getElementById('calendarGrid').addEventListener('click', event => {
                const day = event.target.closest('.notes-calendar-day');
                if (day && day.dataset.date) this.filterByDate(day.dataset.date);
            });
        }

        selectSiblingNote(direction) {
            const filtered = this.getFilteredNotes();
            const currentIndex = filtered.findIndex(note => note.id == this.selectedNoteId);
            const nextNote = filtered[currentIndex + direction];
            if (nextNote) this.selectNote(nextNote.id);
        }

        saveCurrentNote() {
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            const tagsStr = document.getElementById('noteTags').value;
            const date = document.getElementById('noteDate').value;

            if (!title.trim()) {
                alert('Необходимо указать заголовок!');
                return;
            }

            const tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);

            if (this.selectedNoteId) {
                const existing = this.notes.find(note => note.id == this.selectedNoteId);
                this.updateNote(this.selectedNoteId, new Note(
                    this.selectedNoteId,
                    title,
                    content,
                    tags,
                    date,
                    existing ? existing.pinned : false
                ));
            } else {
                const newNote = new Note(Date.now(), title, content, tags, date, false);
                this.addNote(newNote);
                this.selectedNoteId = newNote.id;
            }

            this.render();
        }

        selectNote(id) {
            this.selectedNoteId = id;
            const note = this.notes.find(item => item.id == id);
            if (!note) return;

            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteTags').value = note.tags.join(', ');
            document.getElementById('noteDate').value = note.date || '';
            this.renderNotesList();
        }

        clearForm() {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            document.getElementById('noteTags').value = '';
            document.getElementById('noteDate').value = '';
            this.renderNotesList();
        }

        render() {
            this.renderNotesList();
            this.renderTagsFilter();
            this.renderCalendar();
        }

        renderNotesList() {
            const container = document.getElementById('notesList');
            const filtered = this.getFilteredNotes();

            if (filtered.length === 0) {
                container.innerHTML = '<div class="notes-empty">[ ЗАМЕТКИ НЕ НАЙДЕНЫ ]</div>';
                return;
            }

            container.innerHTML = filtered.map(note => `
                <div class="notes-note-card ${this.selectedNoteId == note.id ? 'selected' : ''}" data-id="${note.id}">
                    <div class="notes-note-title">
                        ${note.pinned ? '<span class="notes-pinned-icon">📌</span> ' : ''}
                        ${this.escapeHtml(note.title)}
                    </div>
                    <div class="notes-note-preview">${this.escapeHtml(note.content.substring(0, 60))}...</div>
                    <div class="notes-note-meta">
                        <div class="notes-note-tags">
                            ${note.tags.map(tag => `<span class="notes-note-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <div>${note.date || 'Без даты'}</div>
                    </div>
                </div>
            `).join('');
        }

        renderTagsFilter() {
            const container = document.getElementById('tagsFilter');
            const tags = this.getAllTags();

            container.innerHTML = `
                <div class="notes-tag-chip ${!this.selectedTag ? 'active' : ''}" data-tag="">ВСЕ</div>
                ${tags.map(tag => `
                    <div class="notes-tag-chip ${this.selectedTag === tag ? 'active' : ''}" data-tag="${this.escapeHtml(tag)}">#${this.escapeHtml(tag)}</div>
                `).join('')}
            `;
        }

        setSelectedTag(tag) {
            this.selectedTag = tag || null;
            this.render();
        }

        renderCalendar() {
            const year = this.currentCalendarDate.getFullYear();
            const month = this.currentCalendarDate.getMonth();
            const monthNames = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];

            document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let grid = '';

            for (let i = 0; i < firstDay; i++) {
                grid += '<div class="notes-calendar-day"></div>';
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasNote = this.getNotesByDate(dateStr).length > 0;
                grid += `<div class="notes-calendar-day ${hasNote ? 'has-note' : ''}" data-date="${dateStr}">${day}</div>`;
            }

            document.getElementById('calendarGrid').innerHTML = grid;
        }

        filterByDate(date) {
            this.searchTerm = '';
            this.selectedTag = null;
            document.getElementById('searchInput').value = '';
            this.render();

            const notesOnDate = this.getNotesByDate(date);
            if (notesOnDate.length > 0) {
                this.selectNote(notesOnDate[0].id);
            }
        }

        escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"]/g, match => {
                if (match === '&') return '&amp;';
                if (match === '<') return '&lt;';
                if (match === '>') return '&gt;';
                if (match === '"') return '&quot;';
                return match;
            });
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.notesManager = new NotesManager();
    });
})();
