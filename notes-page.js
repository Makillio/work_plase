// ============================================
// Task Manager Module (ToDo) - Fallout Edition
// ============================================
(function() {
    let tasks = [];
    let editingId = null;
    let currentMonthDate = new Date();
    let weekOffset = 0;
    let taskForm, taskListContainer, weekGrid, calendarWidget;
    let notePopup, notePopupContent, errorPopup;

    function init() {
        // Получаем все элементы интерфейса
        taskForm = document.getElementById('taskForm');
        taskListContainer = document.getElementById('taskListContainer');
        weekGrid = document.getElementById('weekGrid');
        calendarWidget = document.getElementById('calendarWidget');
        notePopup = document.getElementById('notePopup');
        notePopupContent = document.getElementById('notePopupContent');
        errorPopup = document.getElementById('errorPopup');

        // Привязка событий
        document.getElementById('showAddTaskBtn').addEventListener('click', openAddForm);
        document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
        document.getElementById('cancelTaskBtn').addEventListener('click', closeForm);
        document.getElementById('prevWeekBtn').addEventListener('click', () => { weekOffset--; renderAll(); });
        document.getElementById('nextWeekBtn').addEventListener('click', () => { weekOffset++; renderAll(); });
        document.getElementById('closeNotePopup').addEventListener('click', () => notePopup.classList.remove('active'));
        
        // Закрытие заметки при клике вне
        document.addEventListener('click', (e) => {
            if (!notePopup.contains(e.target) && !e.target.closest('.task-item') && !e.target.closest('.week-task')) {
                notePopup.classList.remove('active');
            }
        });
        
        // Делегирование кликов в списке задач и недельном обзоре
        taskListContainer.addEventListener('click', handleTaskListClick);
        weekGrid.addEventListener('click', handleWeekGridClick);
        
        // Перетаскивание задач в недельном обзоре
        weekGrid.addEventListener('dragstart', handleDragStart);
        weekGrid.addEventListener('dragover', e => e.preventDefault());
        weekGrid.addEventListener('drop', handleDrop);
        
        // Первоначальная отрисовка
        renderAll();
    }

    function handleTaskListClick(e) {
        const item = e.target.closest('.task-item');
        if (!item) return;
        const id = item.dataset.id;
        if (e.target.closest('.edit-btn')) openEditForm(id);
        else if (e.target.closest('.delete-btn')) deleteTask(id);
        else showNoteForTask(id, item);
    }

    function handleWeekGridClick(e) {
        const taskEl = e.target.closest('.week-task');
        if (taskEl) showNoteForTask(taskEl.dataset.id, taskEl);
    }

    function handleDragStart(e) {
        const taskEl = e.target.closest('.week-task');
        if (taskEl) e.dataTransfer.setData('text/plain', taskEl.dataset.id);
    }

    function handleDrop(e) {
        e.preventDefault();
        const dayEl = e.target.closest('.week-day');
        if (!dayEl) return;
        const taskId = e.dataTransfer.getData('text/plain');
        const dateStr = dayEl.dataset.date;
        if (taskId && dateStr) moveTaskToDate(taskId, dateStr);
    }

    function openAddForm() {
        editingId = null;
        taskForm.style.display = 'flex';
        const today = new Date().toISOString().slice(0,10);
        document.getElementById('inputStartDate').value = today;
        document.getElementById('inputEndDate').value = today;
        document.getElementById('inputStartTime').value = '';
        document.getElementById('inputEndTime').value = '';
        document.getElementById('inputDesc').value = '';
        document.getElementById('inputNote').value = '';
        document.getElementById('editModeIndicator').textContent = '';
    }

    function openEditForm(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editingId = id;
        taskForm.style.display = 'flex';
        document.getElementById('inputStartDate').value = task.start.toISOString().slice(0,10);
        document.getElementById('inputEndDate').value = task.end.toISOString().slice(0,10);
        document.getElementById('inputStartTime').value = task.start.toTimeString().slice(0,5);
        document.getElementById('inputEndTime').value = task.end.toTimeString().slice(0,5);
        document.getElementById('inputDesc').value = task.desc;
        document.getElementById('inputNote').value = task.note || '';
        document.getElementById('editModeIndicator').textContent = 'Editing';
    }

    function closeForm() {
        taskForm.style.display = 'none';
        editingId = null;
        document.getElementById('editModeIndicator').textContent = '';
    }

    function saveTask() {
        const desc = document.getElementById('inputDesc').value.trim();
        if (!desc) return;
        const startDateVal = document.getElementById('inputStartDate').value || new Date().toISOString().slice(0,10);
        const endDateVal = document.getElementById('inputEndDate').value || startDateVal;
        const startTime = document.getElementById('inputStartTime').value || '00:00';
        const endTime = document.getElementById('inputEndTime').value || '23:59';
        const note = document.getElementById('inputNote').value.trim();
        
        const [sy,sm,sd] = startDateVal.split('-').map(Number);
        const [ey,em,ed] = endDateVal.split('-').map(Number);
        const [sh,smin] = startTime.split(':').map(Number);
        const [eh,emin] = endTime.split(':').map(Number);
        
        const start = new Date(sy, sm-1, sd, sh, smin);
        const end = new Date(ey, em-1, ed, eh, emin);
        
        if (end < start) {
            showError('End date cannot be earlier than start date');
            return;
        }

        if (editingId) {
            const task = tasks.find(t => t.id === editingId);
            if (task) {
                task.desc = desc;
                task.start = start;
                task.end = end;
                task.note = note;
            }
        } else {
            tasks.push({ id: Date.now().toString(), desc, start, end, note });
        }
        
        closeForm();
        renderAll(); // Гарантированное обновление всех блоков
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        renderAll();
    }

    function moveTaskToDate(taskId, dateStr) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const [y,m,d] = dateStr.split('-').map(Number);
        const duration = task.end - task.start;
        task.start = new Date(y, m, d, task.start.getHours(), task.start.getMinutes());
        task.end = new Date(task.start.getTime() + duration);
        renderAll();
    }

    function showNoteForTask(id, element) {
        const task = tasks.find(t => t.id === id);
        if (!task || !task.note) return; // Заметка показывается только если есть текст
        notePopupContent.textContent = task.note;
        const rect = element.getBoundingClientRect();
        notePopup.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
        notePopup.style.top = (rect.bottom + 8) + 'px';
        notePopup.classList.add('active');
    }

    function showError(msg) {
        errorPopup.textContent = msg;
        errorPopup.classList.add('active');
        taskForm.classList.add('error');
        setTimeout(() => {
            errorPopup.classList.remove('active');
            taskForm.classList.remove('error');
        }, 3000);
    }

    function renderAll() {
        renderTaskList();
        renderWeekView();
        renderCalendar();
    }

    function renderTaskList() {
        const sorted = [...tasks].sort((a,b) => a.start - b.start);
        taskListContainer.innerHTML = sorted.map(task => `
            <div class="task-item" data-id="${task.id}">
                <span class="task-time">${formatDate(task.start)} ${formatTime(task.start)}-${formatTime(task.end)}</span>
                <span class="task-desc">${escapeHtml(task.desc)}</span>
                <div class="task-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Del</button>
                </div>
            </div>
        `).join('');
    }

    function getWeekRange() {
        const now = new Date();
        const day = now.getDay(); // 0 = воскресенье, 1 = понедельник ...
        const monday = new Date(now);
        // Корректировка для начала недели с понедельника
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
        monday.setHours(0,0,0,0);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function renderWeekView() {
        const days = getWeekRange();
        const todayStr = new Date().toDateString();
        const weekLabel = document.getElementById('weekRangeLabel');
        weekLabel.textContent = `${formatShort(days[0])} - ${formatShort(days[6])}`;
        
        let html = '';
        days.forEach(d => {
            const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const isToday = d.toDateString() === todayStr;
            // Фильтруем задачи, у которых дата окончания совпадает с днём недели
            const dayTasks = tasks.filter(t => {
                const endDate = new Date(t.end.getFullYear(), t.end.getMonth(), t.end.getDate());
                return endDate.toDateString() === d.toDateString();
            }).sort((a,b) => a.start - b.start);
            
            html += `<div class="week-day${isToday ? ' today' : ''}" data-date="${dateStr}">
                <div class="day-num">${d.getDate()}</div>`;
            dayTasks.forEach(t => {
                html += `<div class="week-task" draggable="true" data-id="${t.id}">${formatTime(t.end)} ${escapeHtml(t.desc)}</div>`;
            });
            html += `</div>`;
        });
        weekGrid.innerHTML = html;
    }

    function renderCalendar() {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const today = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month+1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();
        
        let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <button class="vault-btn small" id="prevMonthBtn">◄</button>
            <span style="font-weight:bold;">${months[month]} ${year}</span>
            <button class="vault-btn small" id="nextMonthBtn">►</button>
        </div><div class="mini-calendar">`;
        html += ['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => `<span class="day-name">${d}</span>`).join('');
        for (let i = startOffset-1; i >= 0; i--) {
            html += `<span class="day-num other-month">${daysInPrev-i}</span>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = (year === today.getFullYear() && month === today.getMonth() && d === today.getDate());
            html += `<span class="day-num${isToday ? ' today' : ''}">${d}</span>`;
        }
        const totalCells = startOffset + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<span class="day-num other-month">${i}</span>`;
        }
        html += '</div>';
        calendarWidget.innerHTML = html;
        
        document.getElementById('prevMonthBtn').addEventListener('click', () => {
            currentMonthDate.setMonth(currentMonthDate.getMonth()-1);
            renderCalendar();
        });
        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            currentMonthDate.setMonth(currentMonthDate.getMonth()+1);
            renderCalendar();
        });
    }

    // Вспомогательные функции
    function formatTime(date) {
        return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    }
    function formatDate(date) {
        return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}`;
    }
    function formatShort(date) {
        return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()}`;
    }
    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // Если DOM уже загружен
    }
})();