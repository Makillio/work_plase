// ============================================
// Budget Manager Module
// ============================================
(function() {
    let myBudget = 50000;
    let myOperations = [
        { name: "Продукты", amount: 4500 },
        { name: "Транспорт", amount: 1200 },
        { name: "Кино", amount: 800 },
        { name: "Аптека", amount: 1500 }
    ];

    function countMyMoney() {
        const totalSpent = myOperations.reduce((sum, op) => sum + op.amount, 0);
        return { totalSpent, moneyLeft: myBudget - totalSpent };
    }

    function updateAllNumbers() {
        const stats = countMyMoney();
        document.getElementById('budgetDisplayMain').innerText = myBudget.toLocaleString() + ' ₽';
        document.getElementById('totalSumValue').innerText = myBudget.toLocaleString() + ' ₽';
        document.getElementById('remainValue').innerText = stats.moneyLeft.toLocaleString() + ' ₽';
        document.getElementById('expensesValue').innerText = stats.totalSpent.toLocaleString() + ' ₽';
        showHistoryOnScreen();
    }

    function showHistoryOnScreen() {
        const container = document.getElementById('historyList');
        if (!container) return;
        container.innerHTML = '';
        if (myOperations.length === 0) {
            container.innerHTML = '<li class="history-empty">No transactions yet</li>';
            return;
        }
        myOperations.forEach((op, idx) => {
            const li = document.createElement('li');
            li.className = 'history-row';
            li.innerHTML = `<span>${escapeHtml(op.name)}</span><span>-${op.amount.toLocaleString()} ₽</span>`;
            li.addEventListener('click', () => {
                if (confirm(`Delete "${op.name}"?`)) {
                    myOperations.splice(idx, 1);
                    updateAllNumbers();
                }
            });
            container.appendChild(li);
        });
    }

    function addNewOperation(name, amount) {
        const trimmed = name.trim();
        if (!trimmed) { alert('Enter name'); return false; }
        if (isNaN(amount) || amount <= 0) { alert('Enter correct amount'); return false; }
        myOperations.push({ name: trimmed, amount: Number(amount) });
        updateAllNumbers();
        return true;
    }

    function setNewBudget(value) {
        const val = Number(value);
        if (isNaN(val) || val < 0) { alert('Enter correct budget'); return false; }
        myBudget = val;
        updateAllNumbers();
        return true;
    }

    function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('saveBudgetBtn').addEventListener('click', () => {
            const input = document.getElementById('budgetInputField');
            if (setNewBudget(input.value)) input.value = myBudget;
        });
        document.getElementById('addOpBtn').addEventListener('click', () => {
            const name = document.getElementById('newOpName');
            const amount = document.getElementById('newOpAmount');
            if (addNewOperation(name.value, parseFloat(amount.value))) {
                name.value = '';
                amount.value = '';
            }
        });
        updateAllNumbers();
    });
})();