        //Application state and data storage
        let transactions = [];
        let budgetGoal = 0;
        let exchangeRates = {};
        let currentUser = null;

        //Show/hide password functionality
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const button = input.nextElementSibling;
            
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        }

        //User logout functionality
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                // Clear user session data
                currentUser = null;
                sessionStorage.removeItem('currentUser');
                
                //Reset all forms
                document.getElementById('loginForm').reset();
                document.getElementById('signupForm').reset();
                
                //Return to login screen
                showEntryZone();
                
                //Default to login tab
                switchAuthTab('login');
            }
        }

        //Initialize the app
        document.addEventListener('DOMContentLoaded', async function() {
            // Check for existing user session
            currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            
            //Load currency exchange rates
            await fetchExchangeRates();
            
            if (currentUser) {
                showMainPlayground();
            } else {
                showEntryZone();
            }
            
            //Set up form listeners
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('signupForm').addEventListener('submit', handleSignup);
            document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
            document.getElementById('resetPasswordForm').addEventListener('submit', handleResetPassword);
            document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
        });

        //Switch between login and signup forms
        function switchAuthTab(tab) {
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            const forgotForm = document.getElementById('forgotPasswordForm');
            const resetForm = document.getElementById('resetPasswordForm');
            
            //Hide all forms
            loginForm.classList.remove('active');
            signupForm.classList.remove('active');
            forgotForm.classList.remove('active');
            resetForm.classList.remove('active');
            
            //Show selected form
            if (tab === 'login') {
                loginForm.classList.add('active');
            } else if (tab === 'signup') {
                signupForm.classList.add('active');
            } else if (tab === 'forgot') {
                forgotForm.classList.add('active');
            } else if (tab === 'reset') {
                resetForm.classList.add('active');
            }
            
            //Clear any error messages
            document.getElementById('loginMessage').innerHTML = '';
            document.getElementById('signupMessage').innerHTML = '';
            document.getElementById('forgotMessage').innerHTML = '';
            document.getElementById('resetMessage').innerHTML = '';
        }

        //Show forgot password form
        function showForgotPassword() {
            switchAuthTab('forgot');
        }

        //Handle user login
        function handleLogin(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            //Check user credentials from storage
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = { id: user.id, name: user.name, email: user.email };
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showMainPlayground();
                showAuthMessage('loginMessage', 'Login successful!', 'success');
            } else {
                showAuthMessage('loginMessage', 'Invalid email or password', 'error');
            }
        }

        //Handle user registration
        function handleSignup(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            //Form validation checks
            if (password !== confirmPassword) {
                showAuthMessage('signupMessage', 'Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showAuthMessage('signupMessage', 'Password must be at least 6 characters', 'error');
                return;
            }
            
            //Check for duplicate user
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            if (users.find(u => u.email === email)) {
                showAuthMessage('signupMessage', 'User with this email already exists', 'error');
                return;
            }
            
            //Create new user account
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
            
            //Reset signup form
            document.getElementById('signupForm').reset();
            
            //Auto-switch to login after success
            setTimeout(() => switchAuthTab('login'), 1500);
        }

        //Handle forgot password
        function handleForgotPassword(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value;
            
            //Check if user exists
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            const user = users.find(u => u.email === email);
            
            if (!user) {
                showAuthMessage('forgotMessage', 'No account found with this email', 'error');
                return;
            }

            //Store email for password reset
            sessionStorage.setItem('resetEmail', email);
            
            showAuthMessage('forgotMessage', 'Reset link sent! You can now set a new password.', 'success');
            
            //Switch to reset password form
            setTimeout(() => switchAuthTab('reset'), 1500);
        }

        //Handle password reset
        function handleResetPassword(e) {
            e.preventDefault();
            
            const resetEmail = sessionStorage.getItem('resetEmail');
            if (!resetEmail) {
                showAuthMessage('resetMessage', 'Session expired. Please try forgot password again.', 'error');
                setTimeout(() => switchAuthTab('forgot'), 2000);
                return;
            }
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            //Validation
            if (newPassword !== confirmPassword) {
                showAuthMessage('resetMessage', 'Passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showAuthMessage('resetMessage', 'Password must be at least 6 characters', 'error');
                return;
            }
            
            //Update user password
            const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
            const userIndex = users.findIndex(u => u.email === resetEmail);
            
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('budgetTrackerUsers', JSON.stringify(users));
                
                //Clear reset session
                sessionStorage.removeItem('resetEmail');
                
                showAuthMessage('resetMessage', 'Password updated successfully! You can now login.', 'success');
                
                //Clear form and switch to login
                document.getElementById('resetPasswordForm').reset();
                setTimeout(() => switchAuthTab('login'), 1500);
            } else {
                showAuthMessage('resetMessage', 'Error updating password. Please try again.', 'error');
            }
        }

        //Show login/signup area
        function showEntryZone() {
            document.getElementById('entryZone').classList.remove('vanish');
            document.getElementById('mainPlayground').classList.add('vanish');
        }

        //Show main app dashboard
        function showMainPlayground() {
            document.getElementById('entryZone').classList.add('vanish');
            document.getElementById('mainPlayground').classList.remove('vanish');
            
            //Update user greeting
            document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
            
            //Set current date as default
            document.getElementById('date').valueAsDate = new Date();
            
            //Load user's personal data
            loadUserData();
            
            //Refresh app displays
            displayTransactions();
            updateSummary();
            updateBudgetStatus();
            fetchExchangeRates();
        }

        //Display authentication messages
        function showAuthMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            const className = type === 'success' ? 'win-msg' : 'fail-msg';
            element.innerHTML = `<div class="${className}">${message}</div>`;
        }

        //Load user specific data from storage
        function loadUserData() {
            const userKey = `budgetTransactions_${currentUser.id}`;
            const budgetKey = `budgetGoal_${currentUser.id}`;
            
            transactions = JSON.parse(localStorage.getItem(userKey) || '[]');
            budgetGoal = parseFloat(localStorage.getItem(budgetKey) || '0');
        }

        //Save user data to storage
        function saveUserData() {
            if (!currentUser) return;
            
            const userKey = `budgetTransactions_${currentUser.id}`;
            const budgetKey = `budgetGoal_${currentUser.id}`;
            
            localStorage.setItem(userKey, JSON.stringify(transactions));
            localStorage.setItem(budgetKey, budgetGoal.toString());
        }

        //Get live currency exchange rates
        async function fetchExchangeRates() {
            const resultDiv = document.getElementById('conversionResult');
            
            try {
                //Try primary exchange rate API
                try {
                    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                    if (response.ok) {
                        const data = await response.json();
                        exchangeRates = data.rates;
                        exchangeRates.USD = 1;
                        console.log('Exchange rates loaded from primary API');
                        return;
                    }
                } catch (error) {
                    console.log('Primary API failed, trying backup...');
                }
                
                //Try backup exchange rate API
                try {
                    const response = await fetch('https://api.currencyapi.com/v3/latest?apikey=cur_live_free&base_currency=USD');
                    if (response.ok) {
                        const data = await response.json();
                        exchangeRates = data.data;
                        // Convert API format to simple rates
                        const simpleRates = {};
                        for (const [currency, info] of Object.entries(exchangeRates)) {
                            simpleRates[currency] = info.value;
                        }
                        exchangeRates = simpleRates;
                        exchangeRates.USD = 1;
                        console.log('Exchange rates loaded from backup API');
                        if (resultDiv) {
                            resultDiv.innerHTML = '<small style="color: #27ae60;">Live exchange rates loaded (backup)</small>';
                        }
                        return;
                    }
                } catch (error) {
                    console.log('Backup API also failed, using fallback rates');
                }
                
                throw new Error('All APIs failed');
                
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                
                //Use fallback rates when APIs are down
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
                    resultDiv.innerHTML = '<small style="color: #f39c12;">Using cached rates (APIs unavailable)</small>';
                }
            }
        }

        //Process transaction form submission
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

            // Input validation
            if (!description || !amount || !type || !category || !date) {
                showError('Please fill in all fields');
                return;
            }

            if (amount <= 0) {
                showError('Amount must be greater than 0');
                return;
            }

            //Create new transaction 
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

            //Add to beginning of transactions list
            transactions.unshift(transaction);
            
            //Save to browser storage
            saveUserData();
            
            //Clear the form
            document.getElementById('transactionForm').reset();
            document.getElementById('date').valueAsDate = new Date();
            
            //Update all displays
            displayTransactions();
            updateSummary();
            updateBudgetStatus();
            
            //Clear error messages
            clearError();
        }

        //Show all transactions in the list
        function displayTransactions(filteredTransactions = null) {
            const container = document.getElementById('transactionList');
            const transactionsToShow = filteredTransactions || transactions;
            
            if (transactionsToShow.length === 0) {
                container.innerHTML = '<div class="empty-state">No transactions to display</div>';
                return;
            }

            const html = transactionsToShow.map(transaction => `
                <div class="money-move-item">
                    <div class="move-details">
                        <h4>${transaction.description}</h4>
                        <p>${formatCategory(transaction.category)} • ${formatDate(transaction.date)}</p>
                    </div>
                    <div class="move-actions">
                        <span class="move-amount ${transaction.type === 'income' ? 'incoming' : 'outgoing'}">
                            ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <button onclick="deleteTransaction(${transaction.id})" class="danger-btn" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">Delete</button>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = html;
        }

        //Update financial summary cards
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
            
            //Change balance card color based on positive/negative
            const balanceElement = document.getElementById('balance');
            const balanceCard = balanceElement.closest('.cash-card');
            if (balance >= 0) {
                balanceCard.style.background = 'linear-gradient(45deg, #6c757d, #5a6268)';
            } else {
                balanceCard.style.background = 'linear-gradient(45deg, #6c757d, #5a6268)';
            }
        }

        //Handle currency conversion
        async function convertCurrency() {
            const amount = parseFloat(document.getElementById('convertAmount').value);
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            const resultDiv = document.getElementById('conversionResult');

            if (!amount || amount <= 0) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">Please enter a valid amount</span>';
                return;
            }

            //Load rates if not available
            if (Object.keys(exchangeRates).length === 0) {
                await fetchExchangeRates();
            }

            if (Object.keys(exchangeRates).length === 0) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">Exchange rates not available</span>';
                return;
            }

            try {
                //Convert using USD as base currency
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

        //Set monthly budget goal
        function setBudgetGoal() {
            const goal = parseFloat(document.getElementById('budgetGoal').value);
            if (goal && goal > 0) {
                budgetGoal = goal;
                saveUserData();
                updateBudgetStatus();
                document.getElementById('budgetGoal').value = '';
            }
        }

        //Update budget status display
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

        //Filter transactions by type and category
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

        //Sort transactions by date or amount
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

        //Remove single transaction
        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveUserData();
                displayTransactions();
                updateSummary();
                updateBudgetStatus();
            }
        }

        //Remove all transactions
        function clearAllTransactions() {
            if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
                transactions = [];
                saveUserData();
                displayTransactions();
                updateSummary();
                updateBudgetStatus();
            }
        }

        //Helper functions for formatting
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
            errorDiv.innerHTML = `<div class="fail-msg">${message}</div>`;
        }

        function clearError() {
            document.getElementById('errorMessage').innerHTML = '';
        }