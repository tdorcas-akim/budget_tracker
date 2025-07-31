    // Application state
        let transactions = [];
        let budgetGoal = 0;
        let exchangeRates = {};
        let currentUser = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Check if user is logged in
            currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            
            if (currentUser) {
                showMainApp();
            } else {
                showAuthScreen();
            }
            
            // Add form listeners
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('signupForm').addEventListener('submit', handleSignup);
            document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
        });

        // Authentication Functions
        function switchAuthTab(tab) {
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            
            if (tab === 'login') {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            } else {
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
            }
            
            // Clear messages
            document.getElementById('loginMessage').innerHTML = '';
            document.getElementById('signupMessage').innerHTML = '';
        }

        function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = { id: user.id, name: user.name, email: user.email };
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showMainApp();
                showAuthMessage('loginMessage', 'Login successful!', 'success');
            } else {
                showAuthMessage('loginMessage', 'Invalid email or password', 'error');
            }
        }

        function handleSignup(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            // Validation
            if (password !== confirmPassword) {
                showAuthMessage('signupMessage', 'Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showAuthMessage('signupMessage', 'Password must be at least 6 characters', 'error');
                return;
            }
            
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            if (users.find(u => u.email === email)) {
                showAuthMessage('signupMessage', 'User with this email already exists', 'error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now(),
                name,
                email,
                password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('budgetTrackerUsers', JSON.stringify(users));
            
            showAuthMessage('signupMessage', 'Account created successfully! Please login.', 'success');
            
            // Clear form
            document.getElementById('signupForm').reset();
            
            // Switch to login tab
            setTimeout(() => switchAuthTab('login'), 1500);
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                currentUser = null;
                sessionStorage.removeItem('currentUser');
                showAuthScreen();
                
                // Clear forms
                document.getElementById('loginForm').reset();
                document.getElementById('signupForm').reset();
            }
        }

        function showAuthScreen() {
            document.getElementById('authScreen').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }

        function showMainApp() {
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // Update welcome message
            document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
            
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
            
            // Load user-specific data
            loadUserData();
            
            // Initialize app
            displayTransactions();
            updateSummary();
            updateBudgetStatus();
            fetchExchangeRates();
        }

        function showAuthMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            const className = type === 'success' ? 'success' : 'error';
            element.innerHTML = `<div class="${className}">${message}</div>`;
        }

        function loadUserData() {
            const userKey = `budgetTransactions_${currentUser.id}`;
            const budgetKey = `budgetGoal_${currentUser.id}`;
            
            transactions = JSON.parse(localStorage.getItem(userKey) || '[]');
            budgetGoal = parseFloat(localStorage.getItem(budgetKey) || '0');
        }

        function saveUserData() {
            if (!currentUser) return;
            
            const userKey = `budgetTransactions_${currentUser.id}`;
            const budgetKey = `budgetGoal_${currentUser.id}`;
            
            localStorage.setItem(userKey, JSON.stringify(transactions));
            localStorage.setItem(budgetKey, budgetGoal.toString());
        }

        // Fetch exchange rates from API
        async function fetchExchangeRates() {
            const resultDiv = document.getElementById('conversionResult');
            
            try {
                // Primary API: exchangerate-api.com
                try {
                    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                    if (response.ok) {
                        const data = await response.json();
                        exchangeRates = data.rates;
                        exchangeRates.USD = 1;
                        console.log('Exchange rates loaded from exchangerate-api.com (primary)');
                        if (resultDiv) {
                            
                        }
                        return;
                    }
                } catch (error) {
                    console.log('Primary API (exchangerate-api.com) failed, trying backup...');
                }
                
                // Backup API: fixer.io alternative - currencyapi.com
                try {
                    const response = await fetch('https://api.currencyapi.com/v3/latest?apikey=cur_live_free&base_currency=USD');
                    if (response.ok) {
                        const data = await response.json();
                        exchangeRates = data.data;
                        // Convert currencyapi format to simple rates
                        const simpleRates = {};
                        for (const [currency, info] of Object.entries(exchangeRates)) {
                            simpleRates[currency] = info.value;
                        }
                        exchangeRates = simpleRates;
                        exchangeRates.USD = 1;
                        console.log('Exchange rates loaded from currencyapi.com (backup)');
                        if (resultDiv) {
                            //resultDiv.innerHTML = '<small style="color: #27ae60;">📡 Live exchange rates loaded (backup)</small>';
                        }
                        return;
                    }
                } catch (error) {
                    console.log('Backup API failed, using fallback rates');
                }
                
                throw new Error('All APIs failed');
                
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                
                // Use current fallback rates (as of July 2025)
                exchangeRates = {
                    USD: 1.0000,
                    EUR: 0.9180,    
                    GBP: 0.7850,     
                    JPY: 151.20,    
                    CAD: 1.3720,    
                    AUD: 1.5150,    
                    CHF: 0.8920,    
                    CNY: 7.2800,    
                    RWF: 1320.00    
                };
                
                if (resultDiv) {
                    //resultDiv.innerHTML = '<small style="color: #f39c12;">⚠️ Using cached rates (APIs unavailable)</small>';
                }
            }
        }

        // Handle form submission
        function handleTransactionSubmit(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showError('You must be logged in to add transactions');
                return;
            }
            
            const description = document.getElementById('description').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;

            // Validation
            if (!description || !amount || !type || !category || !date) {
                showError('Please fill in all fields');
                return;
            }

            if (amount <= 0) {
                showError('Amount must be greater than 0');
                return;
            }

            // Create transaction
            const transaction = {
                id: Date.now(),
                description,
                amount,
                type,
                category,
                date,
                timestamp: new Date().toISOString(),
                userId: currentUser.id
            };

            // Add to transactions array
            transactions.unshift(transaction);
            
            // Save user data
            saveUserData();
            
            // Reset form
            document.getElementById('transactionForm').reset();
            document.getElementById('date').valueAsDate = new Date();
            
            // Update displays
            displayTransactions();
            updateSummary();
            updateBudgetStatus();
            
            // Clear any error messages
            clearError();
        }

        // Display transactions
        function displayTransactions(filteredTransactions = null) {
            const container = document.getElementById('transactionList');
            const transactionsToShow = filteredTransactions || transactions;
            
            if (transactionsToShow.length === 0) {
                container.innerHTML = '<div class="loading">No transactions to display</div>';
                return;
            }

            const html = transactionsToShow.map(transaction => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <h4>${transaction.description}</h4>
                        <p>${formatCategory(transaction.category)} • ${formatDate(transaction.date)}</p>
                    </div>
                    <div class="transaction-actions">
                        <span class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <button onclick="deleteTransaction(${transaction.id})" class="btn-danger" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">Delete</button>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = html;
        }

        // Update financial summary
        function updateSummary() {
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const balance = income - expenses;

            document.getElementById('totalIncome').textContent = `${income.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `${expenses.toFixed(2)}`;
            document.getElementById('balance').textContent = `${balance.toFixed(2)}`;
            
            // Update balance color based on positive/negative
            const balanceElement = document.getElementById('balance');
            const balanceCard = balanceElement.closest('.summary-card');
            if (balance >= 0) {
                balanceCard.style.background = 'linear-gradient(45deg, #6c757d, #5a6268)';
            } else {
                balanceCard.style.background = 'linear-gradient(45deg, #6c757d, #5a6268)';
            }
        }

        // Currency conversion
        async function convertCurrency() {
            const amount = parseFloat(document.getElementById('convertAmount').value);
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            const resultDiv = document.getElementById('conversionResult');

            if (!amount || amount <= 0) {
                resultDiv.innerHTML = '<span style="color: #e6a8a1ff;">Please enter a valid amount</span>';
                return;
            }

            if (Object.keys(exchangeRates).length === 0) {
                resultDiv.innerHTML = '<span style="color: #e6a8a1ff;">Exchange rates not available</span>';
                return;
            }

            try {
                // Convert via USD as base currency
                const usdAmount = fromCurrency === 'USD' ? amount : amount / exchangeRates[fromCurrency];
                const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * exchangeRates[toCurrency];
                
                resultDiv.innerHTML = `
                    <span style="color: #27ae60;">
                        ${amount.toFixed(2)} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}
                    </span>
                `;
            } catch (error) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">Conversion failed</span>';
            }
        }

        // Budget goal functions
        function setBudgetGoal() {
            const goal = parseFloat(document.getElementById('budgetGoal').value);
            if (goal && goal > 0) {
                budgetGoal = goal;
                saveUserData();
                updateBudgetStatus();
                document.getElementById('budgetGoal').value = '';
            }
        }

        function updateBudgetStatus() {
            const statusDiv = document.getElementById('budgetStatus');
            if (budgetGoal <= 0) {
                statusDiv.innerHTML = '<p style="color: #666;">No budget goal set</p>';
                return;
            }

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyExpenses = transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return t.type === 'expense' && 
                           transactionDate.getMonth() === currentMonth && 
                           transactionDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = (monthlyExpenses / budgetGoal) * 100;
            const remaining = budgetGoal - monthlyExpenses;

            let statusColor = '#27ae60';
            let statusText = 'On track';
            
            if (percentage > 100) {
                statusColor = '#e74c3c';
                statusText = 'Over budget';
            } else if (percentage > 80) {
                statusColor = '#f39c12';
                statusText = 'Close to limit';
            }

            statusDiv.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <p><strong>Monthly Goal:</strong> ${budgetGoal.toFixed(2)}</p>
                    <p><strong>Spent:</strong> ${monthlyExpenses.toFixed(2)} (${percentage.toFixed(1)}%)</p>
                    <p><strong>Remaining:</strong> <span style="color: ${statusColor}">${remaining.toFixed(2)}</span></p>
                    <p><strong>Status:</strong> <span style="color: ${statusColor}">${statusText}</span></p>
                </div>
            `;
        }

        // Filter and sort functions
        function filterTransactions() {
            const typeFilter = document.getElementById('filterType').value;
            const categoryFilter = document.getElementById('filterCategory').value;
            
            let filtered = transactions;
            
            if (typeFilter !== 'all') {
                filtered = filtered.filter(t => t.type === typeFilter);
            }
            
            if (categoryFilter !== 'all') {
                filtered = filtered.filter(t => t.category === categoryFilter);
            }
            
            displayTransactions(filtered);
        }

        function sortTransactions(sortBy) {
            const sorted = [...transactions].sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(b.date) - new Date(a.date);
                } else if (sortBy === 'amount') {
                    return b.amount - a.amount;
                }
                return 0;
            });
            
            displayTransactions(sorted);
        }

        // Delete transaction
        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveUserData();
                displayTransactions();
                updateSummary();
                updateBudgetStatus();
            }
        }

        // Clear all transactions
        function clearAllTransactions() {
            if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
                transactions = [];
                saveUserData();
                displayTransactions();
                updateSummary();
                updateBudgetStatus();
            }
        }

        // Utility functions
        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        function formatCategory(category) {
            const categories = {
                food: 'Food & Dining',
                transport: 'Transportation',
                entertainment: 'Entertainment',
                shopping: 'Shopping',
                bills: 'Bills & Utilities',
                healthcare: 'Healthcare',
                salary: 'Salary',
                other: 'Other'
            };
            return categories[category] || category;
        }

        function showError(message) {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.innerHTML = `<div class="error">${message}</div>`;
        }

        function clearError() {
            document.getElementById('errorMessage').innerHTML = '';
        }