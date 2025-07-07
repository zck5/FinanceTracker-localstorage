document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDashboard();
    renderTransactions();
    renderBudgets();
    renderCategories();
    renderGoals();
    updateCategoryOptions(); // Ensure categories are loaded for the transaction modal
    populateBudgetCategorySelect(); // Populate budget category dropdown
    
    // Set today's date for transactionDate input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterTransactionsBySearch(searchTerm);
    });

    // Initial page load to ensure dashboard is shown
    showPage('dashboard');
});

let transactions = [];
let categories = {
    expense: [
        { name: "อาหาร", icon: "🍔" },
        { name: "เดินทาง", icon: "🚗" },
        { name: "ค่าใช้จ่ายในบ้าน", icon: "🏠" },
        { name: "ช้อปปิ้ง", icon: "🛍️" },
        { name: "ความบันเทิง", icon: "🎬" },
        { name: "สาธารณูปโภค", icon: "💡" }
    ],
    income: [
        { name: "เงินเดือน", icon: "💼" },
        { name: "ของขวัญ", icon: "🎁" },
        { name: "การลงทุน", icon: "📈" }
    ]
};
let budgets = [];
let goals = [];

// --- Custom Alert/Confirm Modal Functions ---
function showAlert(message, title = 'แจ้งเตือน') {
    const modal = document.getElementById('customAlertModal');
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').textContent = message;
    const btnGroup = document.getElementById('customAlertBtnGroup');
    btnGroup.innerHTML = ''; // Clear previous buttons
    
    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary';
    okButton.textContent = 'ตกลง';
    okButton.onclick = () => hideModal('customAlertModal');
    btnGroup.appendChild(okButton);
    
    modal.classList.add('show');
}

function showConfirm(message, onConfirm, title = 'ยืนยันการดำเนินการ') {
    const modal = document.getElementById('customAlertModal');
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').textContent = message;
    const btnGroup = document.getElementById('customAlertBtnGroup');
    btnGroup.innerHTML = ''; // Clear previous buttons

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'ยกเลิก';
    cancelButton.onclick = () => hideModal('customAlertModal');

    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-primary';
    confirmButton.textContent = 'ยืนยัน';
    confirmButton.onclick = () => {
        hideModal('customAlertModal');
        onConfirm(); // Execute the callback function if confirmed
    };

    btnGroup.appendChild(cancelButton);
    btnGroup.appendChild(confirmButton);
    
    modal.classList.add('show');
}


// --- Data Management (localStorage) ---
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem('goals', JSON.stringify(goals));
}

function loadData() {
    const storedTransactions = localStorage.getItem('transactions');
    const storedCategories = localStorage.getItem('categories');
    const storedBudgets = localStorage.getItem('budgets');
    const storedGoals = localStorage.getItem('goals');

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
    }
    if (storedBudgets) {
        budgets = JSON.parse(storedBudgets);
    }
    if (storedGoals) {
        goals = JSON.parse(storedGoals);
    }
}

// --- Page Navigation ---
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Remove 'active' class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show the selected page
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
    }

    // Add 'active' class to the corresponding nav item
    const activeNavItem = document.querySelector(`.nav-item[onclick="showPage('${pageId}')"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Re-render data for the active page
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'transactions') renderTransactions();
    if (pageId === 'budget') renderBudgets();
    if (pageId === 'reports') renderReports(); // Assuming you'll have a renderReports function
    if (pageId === 'categories') renderCategories();
    if (pageId === 'goals') renderGoals();
}

// --- Modals ---
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    // Specific setup for transaction modal
    if (modalId === 'transactionModal') {
        document.getElementById('transactionDescription').value = '';
        document.getElementById('transactionAmount').value = '';
        document.getElementById('transactionType').value = 'expense';
        document.getElementById('transactionNote').value = '';
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        updateCategoryOptions();
        // Reset save button to 'บันทึก' and its original function
        const saveButton = document.querySelector('#transactionModal .btn-primary');
        saveButton.textContent = 'บันทึก';
        saveButton.onclick = saveTransaction;
    } else if (modalId === 'budgetModal') {
        document.getElementById('budgetAmount').value = '';
        document.getElementById('budgetMonth').value = new Date().toISOString().slice(0, 7); // YYYY-MM
        populateBudgetCategorySelect();
        // Reset save button to 'บันทึก' and its original function
        const saveButton = document.querySelector('#budgetModal .btn-primary');
        saveButton.textContent = 'บันทึก';
        saveButton.onclick = saveBudget;
    } else if (modalId === 'categoryModal') {
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryIcon').value = '';
        document.getElementById('categoryType').value = 'expense';
    } else if (modalId === 'goalModal') {
        document.getElementById('goalName').value = '';
        document.getElementById('goalAmount').value = ''; // Use goalAmount as target
        document.getElementById('goalDate').value = ''; // Use goalDate as dueDate
        // Reset save button to 'บันทึก' and its original function
        const saveButton = document.querySelector('#goalModal .btn-primary');
        saveButton.textContent = 'บันทึก';
        saveButton.onclick = () => saveGoal(); // Point to saveGoal for new entry
        delete document.getElementById('goalModal').dataset.editingId; // Clear editing ID
    }
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// --- Transactions ---
function saveTransaction() {
    const description = document.getElementById('transactionDescription').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.getElementById('transactionType').value;
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const note = document.getElementById('transactionNote').value;

    if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
        showAlert('กรุณากรอกข้อมูลรายการให้ครบถ้วนและถูกต้อง');
        return;
    }

    const newTransaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        date,
        note
    };

    transactions.push(newTransaction);
    saveData();
    renderDashboard();
    renderTransactions();
    hideModal('transactionModal');
}

function renderTransactions(filteredTransactions = transactions) {
    const allTransactionsDiv = document.getElementById('allTransactions');
    const recentTransactionsDiv = document.getElementById('recentTransactions');
    
    allTransactionsDiv.innerHTML = '';
    recentTransactionsDiv.innerHTML = '';

    if (filteredTransactions.length === 0) {
        const emptyStateHtml = `
            <div class="empty-state">
                <span class="empty-state-icon">🤷‍♂️</span>
                <p>ยังไม่มีรายการในขณะนี้</p>
                <p>ลองเพิ่มรายการแรกของคุณเลย!</p>
            </div>
        `;
        allTransactionsDiv.innerHTML = emptyStateHtml;
        recentTransactionsDiv.innerHTML = emptyStateHtml;
        return;
    }

    // Sort transactions by date descending for both lists
    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render all transactions
    sortedTransactions.forEach(t => {
        const categoryObj = getCategoryObject(t.category, t.type);
        const icon = categoryObj ? categoryObj.icon : '❓';
        const transactionHtml = `
            <div class="transaction-item ${t.type}">
                <div class="transaction-icon ${t.type}">
                    ${icon}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${t.description}</div>
                    <div class="transaction-meta">${t.category} - ${new Date(t.date).toLocaleDateString('th-TH')}</div>
                </div>
                <div class="transaction-amount ${t.type}">
                    ${t.type === 'expense' ? '-' : '+'}฿${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-secondary btn-small" onclick="editTransaction(${t.id})">แก้ไข</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteTransaction(${t.id})">ลบ</button>
                </div>
            </div>
        `;
        allTransactionsDiv.innerHTML += transactionHtml;
    });

    // For recent transactions, show only the latest 5
    const recentFiveTransactions = sortedTransactions.slice(0, 5);
    if (recentFiveTransactions.length > 0) {
        recentFiveTransactions.forEach(t => {
            const categoryObj = getCategoryObject(t.category, t.type);
            const icon = categoryObj ? categoryObj.icon : '❓';
            const transactionHtml = `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-icon ${t.type}">
                        ${icon}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${t.description}</div>
                        <div class="transaction-meta">${t.category} - ${new Date(t.date).toLocaleDateString('th-TH')}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'expense' ? '-' : '+'}฿${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            `;
            recentTransactionsDiv.innerHTML += transactionHtml;
        });
    } else {
        recentTransactionsDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🤷‍♂️</span>
                <p>ยังไม่มีรายการล่าสุด</p>
            </div>
        `;
    }
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionNote').value = transaction.note;
    
    // Update category options based on type before setting selected category
    updateCategoryOptions(transaction.type);
    document.getElementById('transactionCategory').value = transaction.category;

    // Change save button to update button
    const saveButton = document.querySelector('#transactionModal .btn-primary');
    saveButton.textContent = 'อัปเดต';
    saveButton.onclick = () => updateTransaction(id);
    
    showModal('transactionModal');
}

function updateTransaction(id) {
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) return;

    const description = document.getElementById('transactionDescription').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.getElementById('transactionType').value;
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const note = document.getElementById('transactionNote').value;

    if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
        showAlert('กรุณากรอกข้อมูลรายการให้ครบถ้วนและถูกต้อง');
        return;
    }

    transactions[transactionIndex] = {
        id,
        description,
        amount,
        type,
        category,
        date,
        note
    };

    saveData();
    renderDashboard();
    renderTransactions();
    hideModal('transactionModal');

    // Reset save button to 'บันทึก' and its original function
    const saveButton = document.querySelector('#transactionModal .btn-primary');
    saveButton.textContent = 'บันทึก';
    saveButton.onclick = saveTransaction;
}

function deleteTransaction(id) {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?', () => {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderDashboard();
        renderTransactions();
    });
}

function filterTransactionsBySearch(searchTerm) {
    const filtered = transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm) ||
        t.note.toLowerCase().includes(searchTerm)
    );
    renderTransactions(filtered);
}

function applyFilters() {
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    const filterDateFrom = document.getElementById('filterDateFrom').value;
    const filterDateTo = document.getElementById('filterDateTo').value;

    let filtered = transactions;

    if (filterType) {
        filtered = filtered.filter(t => t.type === filterType);
    }
    if (filterCategory) {
        filtered = filtered.filter(t => t.category === filterCategory);
    }
    if (filterDateFrom) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(filterDateTo));
    }

    renderTransactions(filtered);
}

// --- Dashboard Rendering ---
function renderDashboard() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = `฿${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('totalExpense').textContent = `฿${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('balance').textContent = `฿${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    renderWeeklyChart();
    renderCategoryChart();
}

let weeklyChartInstance;
function renderWeeklyChart() {
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Get data for the last 7 days including today

    const dailyData = {};
    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        dailyData[dateString] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
        const transactionDate = new Date(t.date);
        if (transactionDate >= sevenDaysAgo && transactionDate <= new Date()) {
            const dateString = t.date;
            if (dailyData[dateString]) {
                if (t.type === 'income') {
                    dailyData[dateString].income += t.amount;
                } else {
                    dailyData[dateString].expense += t.amount;
                }
            }
        }
    });

    const labels = Object.keys(dailyData).map(dateString => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    });
    const incomeData = Object.values(dailyData).map(data => data.income);
    const expenseData = Object.values(dailyData).map(data => data.expense);

    const ctx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'รายรับ',
                    data: incomeData,
                    borderColor: 'rgba(0, 200, 81, 1)',
                    backgroundColor: 'rgba(0, 200, 81, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'รายจ่าย',
                    data: expenseData,
                    borderColor: 'rgba(255, 68, 68, 1)',
                    backgroundColor: 'rgba(255, 68, 68, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false,
                    text: 'รายรับ-รายจ่าย 7 วันล่าสุด'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

let categoryChartInstance;
function renderCategoryChart() {
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categorySpending = {};
    expenseTransactions.forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categorySpending);
    const data = Object.values(categorySpending);
    const backgroundColors = generateColors(labels.length);

    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `฿${context.parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function generateColors(numColors) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED',
        '#C9CBCF', '#7BC4E2', '#A1C935', '#FB6900', '#F9A03F', '#D1C4E9', '#BBDEFB'
    ];
    // Cycle through predefined colors or generate more if needed
    const generated = [];
    for (let i = 0; i < numColors; i++) {
        generated.push(colors[i % colors.length]);
    }
    return generated;
}

// --- Categories ---
function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value.trim();
    const type = document.getElementById('categoryType').value;

    if (!name) {
        showAlert('กรุณากรอกชื่อหมวดหมู่');
        return;
    }
    if (!icon) {
        showAlert('กรุณาเลือกไอคอนสำหรับหมวดหมู่');
        return;
    }

    // Check for duplicate category name within the same type
    const isDuplicate = categories[type].some(cat => cat.name === name);
    if (isDuplicate) {
        showAlert(`หมวดหมู่ "${name}" มีอยู่แล้วในประเภท ${type === 'income' ? 'รายรับ' : 'รายจ่าย'}`);
        return;
    }

    categories[type].push({ name, icon });
    saveData();
    renderCategories();
    updateCategoryOptions(); // Update transaction and budget modals
    hideModal('categoryModal');
}

function renderCategories() {
    const categoryChipsDiv = document.getElementById('categoryChips');
    categoryChipsDiv.innerHTML = ''; // Clear existing chips

    const allCategories = [...categories.expense, ...categories.income];

    if (allCategories.length === 0) {
        categoryChipsDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🏷️</span>
                <p>ยังไม่มีหมวดหมู่ที่กำหนดไว้</p>
                <p>เพิ่มหมวดหมู่แรกของคุณเลย!</p>
            </div>
        `;
        return;
    }

    // Group categories by type for display
    const groupedCategories = {
        expense: categories.expense,
        income: categories.income
    };

    for (const type in groupedCategories) {
        if (groupedCategories[type].length > 0) {
            const typeHeader = document.createElement('h4');
            typeHeader.textContent = type === 'expense' ? 'หมวดหมู่รายจ่าย' : 'หมวดหมู่รายรับ';
            typeHeader.style.cssText = 'width: 100%; margin-top: 20px; margin-bottom: 10px; color: var(--primary);';
            categoryChipsDiv.appendChild(typeHeader);

            groupedCategories[type].forEach(cat => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.innerHTML = `
                    <span>${cat.icon} ${cat.name}</span>
                    <button class="btn-delete-chip" onclick="deleteCategory('${cat.name}', '${type}')">✖</button>
                `;
                categoryChipsDiv.appendChild(chip);
            });
        }
    }
}

function deleteCategory(name, type) {
    showConfirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${name}"? รายการที่เกี่ยวข้องจะไม่ถูกลบออกไป`, () => {
        categories[type] = categories[type].filter(cat => cat.name !== name);
        saveData();
        renderCategories();
        updateCategoryOptions(); // Update transaction and budget modals
        renderTransactions(); // Re-render transactions in case a category was deleted that was in use
    });
}

function getCategoryObject(name, type) {
    // Try to find in specified type first
    let category = categories[type]?.find(cat => cat.name === name);
    // If not found, try finding in the other type (e.g., if a transaction type changed)
    if (!category) {
        const otherType = type === 'income' ? 'expense' : 'income';
        category = categories[otherType]?.find(cat => cat.name === name);
    }
    return category;
}

function updateCategoryOptions(selectedType = document.getElementById('transactionType').value) {
    const transactionCategorySelect = document.getElementById('transactionCategory');
    const filterCategorySelect = document.getElementById('filterCategory');
    
    // Clear existing options for transaction category
    transactionCategorySelect.innerHTML = '';
    
    // Clear existing options for filter category, and add "All" option
    filterCategorySelect.innerHTML = '<option value="">ทั้งหมด</option>'; 

    // Populate transaction category select based on type
    const currentCategoriesForType = categories[selectedType] || [];
    currentCategoriesForType.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        transactionCategorySelect.appendChild(option);
    });

    // Populate filter category with ALL categories (unique ones)
    const allUniqueCategories = new Set();
    Object.values(categories).flat().forEach(cat => allUniqueCategories.add(cat.name));

    Array.from(allUniqueCategories).sort().forEach(catName => {
        const option = document.createElement('option');
        option.value = catName;
        option.textContent = `${getCategoryObject(catName, 'expense')?.icon || getCategoryObject(catName, 'income')?.icon || '❓'} ${catName}`; // Get icon from either expense or income
        filterCategorySelect.appendChild(option);
    });

    // If no categories, add a placeholder
    if (currentCategoriesForType.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'ไม่มีหมวดหมู่';
        transactionCategorySelect.appendChild(placeholder);
    }
}


// --- Budgets ---
function saveBudget() {
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const month = document.getElementById('budgetMonth').value; // YYYY-MM

    if (!category || isNaN(amount) || amount <= 0 || !month) {
        showAlert('กรุณากรอกข้อมูลงบประมาณให้ครบถ้วนและถูกต้อง');
        return;
    }

    // Check for existing budget for the same category and month
    const existingBudgetIndex = budgets.findIndex(b => b.category === category && b.month === month);

    if (existingBudgetIndex > -1) {
        // Update existing budget
        budgets[existingBudgetIndex].amount = amount;
    } else {
        // Add new budget
        budgets.push({ id: Date.now(), category, amount, month });
    }

    saveData();
    renderBudgets();
    hideModal('budgetModal');
}

function renderBudgets() {
    const budgetListDiv = document.getElementById('budgetList');
    budgetListDiv.innerHTML = '';

    if (budgets.length === 0) {
        budgetListDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🎯</span>
                <p>ยังไม่มีงบประมาณที่กำหนดไว้</p>
                <p>ตั้งงบประมาณแรกของคุณเลย!</p>
            </div>
        `;
        return;
    }

    budgets.sort((a, b) => { // Sort by month
        if (a.month < b.month) return -1;
        if (a.month > b.month) return 1;
        return 0;
    }).forEach(budget => {
        const spentAmount = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(budget.month))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percentage = (spentAmount / budget.amount) * 100;
        let progressColor = 'var(--primary)';
        if (percentage > 100) {
            progressColor = 'var(--danger)'; // Over budget
        } else if (percentage > 80) {
            progressColor = 'var(--warning)'; // Approaching limit
        }

        const budgetItemHtml = `
            <div class="budget-item card">
                <div class="budget-details">
                    <div class="budget-category">
                        ${getCategoryObject(budget.category, 'expense')?.icon || '❓'} ${budget.category} (${new Date(budget.month + '-01').toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })})
                    </div>
                    <div class="budget-spent">ใช้ไปแล้ว ฿${spentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} จาก ฿${budget.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, percentage)}%; background: ${progressColor};"></div>
                    </div>
                </div>
                <div class="budget-actions">
                    <button class="btn btn-secondary btn-small" onclick="editBudget(${budget.id})">แก้ไข</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteBudget(${budget.id})">ลบ</button>
                </div>
            </div>
        `;
        budgetListDiv.innerHTML += budgetItemHtml;
    });
}

function editBudget(id) {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;

    document.getElementById('budgetCategory').value = budget.category;
    document.getElementById('budgetAmount').value = budget.amount;
    document.getElementById('budgetMonth').value = budget.month;

    // Change save button to update button
    const saveButton = document.querySelector('#budgetModal .btn-primary');
    saveButton.textContent = 'อัปเดต';
    saveButton.onclick = () => updateBudget(id);
    
    showModal('budgetModal');
}

function updateBudget(id) {
    const budgetIndex = budgets.findIndex(b => b.id === id);
    if (budgetIndex === -1) return;

    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const month = document.getElementById('budgetMonth').value;

    if (!category || isNaN(amount) || amount <= 0 || !month) {
        showAlert('กรุณากรอกข้อมูลงบประมาณให้ครบถ้วนและถูกต้อง');
        return;
    }

    budgets[budgetIndex] = {
        id,
        category,
        amount,
        month
    };

    saveData();
    renderBudgets();
    hideModal('budgetModal');

    // Reset save button to 'บันทึก' and its original function
    const saveButton = document.querySelector('#budgetModal .btn-primary');
    saveButton.textContent = 'บันทึก';
    saveButton.onclick = saveBudget;
}

function deleteBudget(id) {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบงบประมาณนี้?', () => {
        budgets = budgets.filter(b => b.id !== id);
        saveData();
        renderBudgets();
    });
}

function populateBudgetCategorySelect() {
    const budgetCategorySelect = document.getElementById('budgetCategory');
    budgetCategorySelect.innerHTML = '<option value="">เลือกหมวดหมู่</option>'; // Default option

    // Only expense categories are relevant for budgets
    categories.expense.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        budgetCategorySelect.appendChild(option);
    });
}


// --- Goals ---
function saveGoal() {
    const name = document.getElementById('goalName').value.trim();
    // goalAmount is now the target amount based on your HTML
    const targetAmount = parseFloat(document.getElementById('goalAmount').value); 
    const dueDate = document.getElementById('goalDate').value; // goalDate is now the dueDate

    // When creating a new goal, savedAmount starts at 0
    let savedAmount = 0; 
    
    // If it's an edit operation, use the existing savedAmount
    const editingId = document.getElementById('goalModal').dataset.editingId;
    if (editingId) {
        const existingGoal = goals.find(g => g.id === parseInt(editingId));
        if (existingGoal) {
            savedAmount = existingGoal.savedAmount; // Preserve existing saved amount
        }
    }

    if (!name || isNaN(targetAmount) || targetAmount <= 0 || !dueDate) {
        showAlert('กรุณากรอกข้อมูลเป้าหมายให้ครบถ้วนและถูกต้อง (ชื่อ, จำนวนเป้าหมาย, วันที่ครบกำหนด)');
        return;
    }
    if (savedAmount > targetAmount) {
        showAlert('ยอดเงินที่ออมแล้วไม่ควรเกินยอดเงินเป้าหมาย');
        return;
    }

    if (editingId) {
        // Update existing goal
        const goalIndex = goals.findIndex(g => g.id === parseInt(editingId));
        if (goalIndex > -1) {
            goals[goalIndex] = {
                id: parseInt(editingId),
                name,
                targetAmount,
                savedAmount, // Use the (potentially preserved) savedAmount
                dueDate
            };
        }
    } else {
        // Create new goal
        goals.push({
            id: Date.now(),
            name,
            targetAmount,
            savedAmount,
            dueDate
        });
    }

    saveData();
    renderGoals();
    hideModal('goalModal');

    // Reset save button to 'บันทึก' and clear editingId
    const saveButton = document.querySelector('#goalModal .btn-primary');
    saveButton.textContent = 'บันทึก';
    saveButton.onclick = () => saveGoal();
    delete document.getElementById('goalModal').dataset.editingId;
}

function renderGoals() {
    const goalsListDiv = document.getElementById('goalsList');
    goalsListDiv.innerHTML = '';

    if (goals.length === 0) {
        goalsListDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🏆</span>
                <p>ยังไม่มีเป้าหมายการออมที่กำหนดไว้</p>
                <p>ตั้งเป้าหมายแรกของคุณเลย!</p>
            </div>
        `;
        return;
    }

    goals.forEach(goal => {
        const progress = (goal.savedAmount / goal.targetAmount) * 100;
        const remaining = goal.targetAmount - goal.savedAmount;
        const formattedDueDate = new Date(goal.dueDate + 'T00:00:00').toLocaleDateString('th-TH'); // Add T00:00:00 to avoid timezone issues

        let progressColor = 'var(--info)';
        if (progress >= 100) {
            progressColor = 'var(--success)'; // Goal achieved
        } else if (progress > 80 && remaining <= 500) { // Example: approaching goal
            progressColor = 'var(--warning)';
        }

        const goalItemHtml = `
            <div class="goal-item card">
                <div class="goal-details">
                    <div class="goal-name">🏆 ${goal.name}</div>
                    <div class="goal-amounts">
                        ออมแล้ว ฿${goal.savedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / เป้าหมาย ฿${goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, progress)}%; background: ${progressColor};"></div>
                    </div>
                    <div class="goal-due-date" style="display: flex; justify-content: space-between; font-size: 0.9em; color: #666; margin-top: 5px;">
                        <span>ความคืบหน้า: ${progress.toFixed(1)}%</span>
                        <span>เหลืออีก: ฿${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style="text-align: right; font-size: 0.9em; color: #666; margin-top: 5px;">
                        ครบกำหนด: ${formattedDueDate}
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="btn btn-secondary btn-small" onclick="addSavingsToGoal(${goal.id})">💰 เพิ่มเงินออม</button>
                    <button class="btn btn-secondary btn-small" onclick="editGoal(${goal.id})">✏️ แก้ไข</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteGoal(${goal.id})">🗑️ ลบ</button>
                </div>
            </div>
        `;
        goalsListDiv.innerHTML += goalItemHtml;
    });
}

function addSavingsToGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        showConfirm(`คุณต้องการเพิ่มเงินออมเท่าไหร่สำหรับเป้าหมาย "${goal.name}"?`, (value) => {
            const amountToAdd = parseFloat(value);
            if (!isNaN(amountToAdd) && amountToAdd > 0) {
                goal.savedAmount += amountToAdd;
                if (goal.savedAmount > goal.targetAmount) {
                    goal.savedAmount = goal.targetAmount; // Cap at target amount
                }
                saveData();
                renderGoals();
            } else if (value !== null && value !== '') { // User didn't cancel, but input was invalid/zero
                showAlert('กรุณากรอกจำนวนเงินที่เป็นบวกและถูกต้อง');
            }
        }, 'เพิ่มเงินออม', true, 'จำนวนเงินที่เพิ่ม'); // Added optional prompt and input type
    }
}

// Custom prompt implementation for addSavingsToGoal
function showConfirm(message, onConfirmCallback, title = 'ยืนยัน', isPrompt = false, promptPlaceholder = '') {
    const modal = document.getElementById('customAlertModal');
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').textContent = message;
    const btnGroup = document.getElementById('customAlertBtnGroup');
    btnGroup.innerHTML = ''; // Clear previous buttons

    let promptInput;
    if (isPrompt) {
        promptInput = document.createElement('input');
        promptInput.type = 'number';
        promptInput.id = 'customPromptInput';
        promptInput.placeholder = promptPlaceholder;
        promptInput.className = 'form-control'; // Assuming basic styling from your CSS
        promptInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;';
        document.getElementById('customAlertMessage').insertAdjacentElement('afterend', promptInput); // Insert after message
    }

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'ยกเลิก';
    cancelButton.onclick = () => {
        hideModal('customAlertModal');
        if (isPrompt && promptInput) promptInput.remove(); // Clean up input
    };

    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-primary';
    confirmButton.textContent = 'ยืนยัน';
    confirmButton.onclick = () => {
        hideModal('customAlertModal');
        if (isPrompt && promptInput) {
            onConfirmCallback(promptInput.value); // Pass input value to callback
            promptInput.remove(); // Clean up input
        } else {
            onConfirmCallback();
        }
    };

    btnGroup.appendChild(cancelButton);
    btnGroup.appendChild(confirmButton);
    
    modal.classList.add('show');
    if (isPrompt && promptInput) promptInput.focus();
}


function editGoal(id) {
    const goalToEdit = goals.find(g => g.id === id);
    if (goalToEdit) {
        showModal('goalModal');
        document.getElementById('goalName').value = goalToEdit.name;
        document.getElementById('goalAmount').value = goalToEdit.targetAmount; // Set target amount
        document.getElementById('goalDate').value = goalToEdit.dueDate; // Set due date
        
        // Store the ID for update
        document.getElementById('goalModal').dataset.editingId = id;

        // Change save button to update
        const saveButton = document.querySelector('#goalModal .btn-primary');
        saveButton.textContent = 'บันทึกการแก้ไข';
        saveButton.onclick = () => saveGoal(); // saveGoal now handles updates based on editingId
    }
}


function deleteGoal(id) {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้?', () => {
        goals = goals.filter(g => g.id !== id);
        saveData();
        renderGoals();
    });
}

// --- Reports (Placeholder - you'd implement actual reporting logic here) ---
function renderReports() {
    // This function would generate and display charts/tables for reports
    renderMonthlyChart(); 
    renderTrendChart();
}

let monthlyChartInstance;
function renderMonthlyChart() {
    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    const monthlyIncome = {};
    const monthlyExpense = {};

    transactions.forEach(t => {
        const monthYear = t.date.substring(0, 7); // YYYY-MM
        if (t.type === 'income') {
            monthlyIncome[monthYear] = (monthlyIncome[monthYear] || 0) + t.amount;
        } else {
            monthlyExpense[monthYear] = (monthlyExpense[monthYear] || 0) + t.amount;
        }
    });

    const allMonths = Array.from(new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])).sort();

    const incomeData = allMonths.map(month => monthlyIncome[month] || 0);
    const expenseData = allMonths.map(month => monthlyExpense[month] || 0);

    const labels = allMonths.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
    });

    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'รายรับ',
                    data: incomeData,
                    backgroundColor: 'rgba(0, 200, 81, 0.7)',
                    borderColor: 'rgba(0, 200, 81, 1)',
                    borderWidth: 1
                },
                {
                    label: 'รายจ่าย',
                    data: expenseData,
                    backgroundColor: 'rgba(255, 68, 68, 0.7)',
                    borderColor: 'rgba(255, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false,
                    text: 'รายงานรายเดือน'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

let trendChartInstance;
function renderTrendChart() {
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    const monthlyCategorySpending = {}; // { 'YYYY-MM': { 'Category1': amount, 'Category2': amount } }

    transactions.filter(t => t.type === 'expense').forEach(t => {
        const monthYear = t.date.substring(0, 7);
        if (!monthlyCategorySpending[monthYear]) {
            monthlyCategorySpending[monthYear] = {};
        }
        monthlyCategorySpending[monthYear][t.category] = (monthlyCategorySpending[monthYear][t.category] || 0) + t.amount;
    });

    const allMonths = Object.keys(monthlyCategorySpending).sort();
    const allExpenseCategories = Array.from(new Set(transactions.filter(t => t.type === 'expense').map(t => t.category)));

    const datasets = allExpenseCategories.map((category, index) => {
        const data = allMonths.map(month => monthlyCategorySpending[month][category] || 0);
        const color = generateColors(allExpenseCategories.length)[index];
        return {
            label: category,
            data: data,
            borderColor: color,
            backgroundColor: color + '40', // 40 for 25% opacity
            fill: true,
            tension: 0.3
        };
    });

    const labels = allMonths.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
    });

    const ctx = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false,
                    text: 'เทรนด์การใช้จ่าย'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true, // To show stacked area chart for trends
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}
