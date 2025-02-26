document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const filterCategory = document.getElementById("filter-category");
    const sortOption = document.getElementById("sort-option");
    const noExpensesMessage = document.getElementById("no-expenses");
    const body = document.body;

    // Initialize data and state
    let expenses = [];
    let editingId = null;

    // Set current date as default
    document.getElementById("date").valueAsDate = new Date();

    // Initialize the UI
    renderExpenses();
    checkDarkModePreference();

    // Event Listeners
    darkModeToggle.addEventListener("click", toggleDarkMode);
    expenseForm.addEventListener("submit", handleFormSubmit);
    expenseList.addEventListener("click", handleTableActions);
    filterCategory.addEventListener("change", renderExpenses);
    sortOption.addEventListener("change", renderExpenses);

    // Dark Mode Toggle
    function toggleDarkMode() {
        body.classList.toggle("dark-mode");
        updateDarkModeButton();
    }

    function updateDarkModeButton() {
        const isDarkMode = body.classList.contains("dark-mode");
        darkModeToggle.innerHTML = isDarkMode ? 
            '<i class="bi bi-brightness-high"></i> Light Mode' : 
            '<i class="bi bi-moon-stars"></i> Dark Mode';
        darkModeToggle.classList.toggle("btn-outline-light", isDarkMode);
        darkModeToggle.classList.toggle("btn-outline-dark", !isDarkMode);
    }

    function checkDarkModePreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add("dark-mode");
            updateDarkModeButton();
        }
    }

    // Form submission
    function handleFormSubmit(event) {
        event.preventDefault();
        addExpense();
    }

    // Table actions
    function handleTableActions(event) {
        const target = event.target;
        
        if (target.closest(".edit-expense")) {
            editExpense(event);
        } else if (target.closest(".update-expense")) {
            updateExpense(event);
        } else if (target.closest(".delete-expense")) {
            deleteExpense(event);
        } else if (target.closest(".cancel-edit")) {
            cancelEdit();
        }
    }

    // Add a new expense
    function addExpense() {
        const amount = document.getElementById("amount").value;
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value || "No description";
        const date = document.getElementById("date").value;

        if (!amount || !category || !date) {
            showToast("Please fill all required fields!", "error");
            return;
        }

        const expense = {
            id: Date.now(),
            amount: parseFloat(amount),
            category,
            description,
            date
        };

        expenses.push(expense);
        renderExpenses();
        expenseForm.reset();
        document.getElementById("date").valueAsDate = new Date();
        
        showToast("Expense added successfully!", "success");
    }

    // Render expenses based on filter and sort options
    function renderExpenses() {
        const categoryFilter = filterCategory.value;
        const sortBy = sortOption.value;
        
        // Filter expenses
        let filteredExpenses = [...expenses];
        if (categoryFilter !== "All") {
            filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
        }
        
        // Sort expenses
        filteredExpenses = sortExpenses(filteredExpenses, sortBy);
        
        // Clear the expense list
        expenseList.innerHTML = "";
        
        // Show or hide no expenses message
        if (filteredExpenses.length === 0) {
            noExpensesMessage.classList.remove("d-none");
        } else {
            noExpensesMessage.classList.add("d-none");
            
            // Create table rows for each expense
            filteredExpenses.forEach((expense, index) => {
                const formattedAmount = formatCurrency(expense.amount);
                const formattedDate = formatDate(expense.date);
                
                const row = document.createElement("tr");
                row.dataset.id = expense.id;
                
                // Simplified row with fewer columns for mobile
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${formattedAmount}</td>
                    <td><span class="badge ${getCategoryBadgeClass(expense.category)}">${expense.category}</span></td>
                    <td>${expense.description}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-expense me-1">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-expense">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                expenseList.appendChild(row);
            });
        }
    }

    // Edit an expense
    function editExpense(event) {
        cancelEdit(); // Cancel any existing edit
        
        const row = event.target.closest("tr");
        editingId = parseInt(row.dataset.id);
        const expense = expenses.find(exp => exp.id === editingId);

        if (!expense) return;

        row.innerHTML = `
            <td>#</td>
            <td>
                <input type="number" class="form-control form-control-sm" value="${expense.amount}" id="edit-amount" min="0" step="0.01">
            </td>
            <td>
                <select class="form-select form-select-sm" id="edit-category">
                    <option value="Food" ${expense.category === "Food" ? "selected" : ""}>Food</option>
                    <option value="Travel" ${expense.category === "Travel" ? "selected" : ""}>Travel</option>
                    <option value="Bills" ${expense.category === "Bills" ? "selected" : ""}>Bills</option>
                    <option value="Entertainment" ${expense.category === "Entertainment" ? "selected" : ""}>Entertainment</option>
                    <option value="Others" ${expense.category === "Others" ? "selected" : ""}>Others</option>
                </select>
            </td>
                    <td>
                <input type="text" class="form-control form-control-sm" value="${expense.description}" id="edit-description">
            </td>
            <td><input type="date" class="form-control form-control-sm" value="${expense.date}" id="edit-date"></td>
            <td>
                <button class="btn btn-success btn-sm update-expense">
                    <i class="bi bi-check"></i>
                </button>
                <button class="btn btn-secondary btn-sm cancel-edit">
                    <i class="bi bi-x"></i>
                </button>
            </td>
        `;
    }

    // Cancel editing
    function cancelEdit() {
        if (editingId !== null) {
            editingId = null;
            renderExpenses();
        }
    }

    // Update an expense
    function updateExpense(event) {
        const row = event.target.closest("tr");
        const updatedAmount = document.getElementById("edit-amount").value;
        const updatedCategory = document.getElementById("edit-category").value;
        const updatedDescription = document.getElementById("edit-description").value;
        const updatedDate = document.getElementById("edit-date").value;

        if (!updatedAmount || !updatedCategory || !updatedDate) {
            showToast("Please fill all required fields!", "error");
            return;
        }

        const expenseIndex = expenses.findIndex(exp => exp.id === editingId);
        if (expenseIndex !== -1) {
            expenses[expenseIndex] = {
                ...expenses[expenseIndex],
                amount: parseFloat(updatedAmount),
                category: updatedCategory,
                description: updatedDescription,
                date: updatedDate
            };
            
            editingId = null;
            renderExpenses();
            
            showToast("Expense updated successfully!", "success");
        }
    }

    // Delete an expense
    function deleteExpense(event) {
        const row = event.target.closest("tr");
        const expenseId = parseInt(row.dataset.id);
        
        if (confirm("Are you sure you want to delete this expense?")) {
            expenses = expenses.filter(expense => expense.id !== expenseId);
            renderExpenses();
            showToast("Expense deleted successfully!", "info");
        }
    }

    // Sort expenses based on the selected option
    function sortExpenses(expensesToSort, sortBy) {
        return expensesToSort.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.date) - new Date(a.date);
                case "oldest":
                    return new Date(a.date) - new Date(b.date);
                case "highest":
                    return b.amount - a.amount;
                case "lowest":
                    return a.amount - b.amount;
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
    }

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Get appropriate badge class for category
    function getCategoryBadgeClass(category) {
        switch (category) {
            case "Food": return "bg-success";
            case "Travel": return "bg-info";
            case "Bills": return "bg-warning";
            case "Entertainment": return "bg-primary";
            case "Others": return "bg-secondary";
            default: return "bg-secondary";
        }
    }

    // Show toast notification
    function showToast(message, type = "info") {
        const backgroundColor = {
            success: "#198754",
            error: "#dc3545",
            info: "#0dcaf0",
            warning: "#ffc107"
        };

        Toastify({
            text: message,
            duration: 2000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: backgroundColor[type]
        }).showToast();
    }
});