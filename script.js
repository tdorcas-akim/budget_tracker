// Application state
        let transactions = JSON.parse(localStorage.getItem('budgetTransactions')) || [];
        let budgetGoal = parseFloat(localStorage.getItem('budgetGoal')) || 0;
        let exchangeRates = {};

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
            
            // Load saved data
            displayTransactions();
            updateSummary();
            updateBudgetStatus();
            
            // Fetch exchange rates
            fetchExchangeRates();
            
            // Add form submit listener
            document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
        });

        // Fetch exchange rates from API
        async function fetchExchangeRates() {
            try {
                // Using fxratesapi.com - more CORS-friendly
                const response = await fetch('https://api.fxratesapi.com/latest?base=USD&currencies=EUR,GBP,JPY,CAD,AUD,CHF,CNY');
                
                if (!response.ok) {
                    // Try backup API
                    const backupResponse = await fetch('https://open.er-api.com/v6/latest/USD');
                    if (!backupResponse.ok) {
                        throw new Error('Both APIs failed');
                    }
                    const backupData = await backupResponse.json();
                    exchangeRates = backupData.rates;
                    console.log('Exchange rates loaded from backup API');
                    return;
                }
                
                const data = await response.json();
                exchangeRates = data.rates;
                exchangeRates.USD = 1; // Add USD base rate
                console.log('Exchange rates loaded successfully from primary API');
                
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                console.log('Using fallback exchange rates for demo');
                // Updated fallback rates (more realistic)
                exchangeRates = {
                    USD: 1,
                    EUR: 0.92,
                    GBP: 0.79,
                    JPY: 149.50,
                    CAD: 1.36,
                    AUD: 1.52,
                    CHF: 0.88,
                    CNY: 7.24
                };
                
                // Show a less alarming message to user
                const conversionResult = document.getElementById('conversionResult');
                if (conversionResult) {
                    conversionResult.innerHTML = '<small style="color: #f39c12;">📡 Using cached exchange rates</small>';
                }
            }
        }

        // Handle form submission
        function handleTransactionSubmit(e) {
            e.preventDefault();
            
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
                timestamp: new Date().toISOString()
            };

            // Add to transactions array
            transactions.unshift(transaction);
            
            // Save to localStorage
            localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
            
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
                            ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
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

            document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
            document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
            
            // Update balance color based on positive/negative
            const balanceElement = document.getElementById('balance');
            const balanceCard = balanceElement.closest('.summary-card');
            if (balance >= 0) {
                balanceCard.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
            } else {
                balanceCard.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            }
        }

        // Currency conversion
        async function convertCurrency() {
            const amount = parseFloat(document.getElementById('convertAmount').value);
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            const resultDiv = document.getElementById('conversionResult');

            if (!amount || amount <= 0) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">Please enter a valid amount</span>';
                return;
            }

            if (Object.keys(exchangeRates).length === 0) {
                resultDiv.innerHTML = '<span style="color: #e74c3c;">Exchange rates not available</span>';
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
                localStorage.setItem('budgetGoal', budgetGoal.toString());
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
                    <p><strong>Monthly Goal:</strong> $${budgetGoal.toFixed(2)}</p>
                    <p><strong>Spent:</strong> $${monthlyExpenses.toFixed(2)} (${percentage.toFixed(1)}%)</p>
                    <p><strong>Remaining:</strong> <span style="color: ${statusColor}">$${remaining.toFixed(2)}</span></p>
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
                localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
                displayTransactions();
                updateSummary();
                updateBudgetStatus();
            }
        }

        // Clear all transactions
        function clearAllTransactions() {
            if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
                transactions = [];
                localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
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
                food: '🍽️ Food & Dining',
                transport: '🚗 Transportation',
                entertainment: '🎬 Entertainment',
                shopping: '🛒 Shopping',
                bills: '💡 Bills & Utilities',
                healthcare: '🏥 Healthcare',
                salary: '💼 Salary',
                freelance: '💻 Freelance',
                other: '📝 Other'
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