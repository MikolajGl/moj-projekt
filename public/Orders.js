const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

let payload;
try {
    payload = JSON.parse(atob(token.split('.')[1]));
} catch (err) {
    alert('Błędny token. Zaloguj się ponownie.');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

if (payload.role !== 'admin') {
    alert('Brak dostępu: tylko dla admina');
    window.location.href = 'test1.html';
}

function getStatusBadge(status) {
    const statusMap = {
        new: { label: 'Nowe', color: '#3498db' },
        processing: { label: 'W realizacji', color: '#f39c12' },
        completed: { label: 'Zakończone', color: '#27ae60' }
    };

    const statusInfo = statusMap[status] || statusMap.new;
    return `<span class="status-badge" style="background-color: ${statusInfo.color}">${statusInfo.label}</span>`;
}

// Format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
}

async function fetchAllOrders() {
    try {
        const response = await fetch('http://localhost:3001/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Problem with fetching orders');
        }

        const orders = await response.json();
        displayOrders(orders);
        updateOrdersCount(orders.length);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Nie udało się załadować zamówień', 'error');
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    const searchTerm = document.getElementById('searchOrders').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filteredOrders = orders.filter(order => {
        const matchesSearch = order.userId.username.toLowerCase().includes(searchTerm) ||
                            order._id.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    filteredOrders.sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'price-high':
                return b.total - a.total;
            case 'price-low':
                return a.total - b.total;
            default:
                return 0;
        }
    });

    container.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>
                        <i class="fas fa-shopping-bag"></i>
                        Zamówienie #${order._id.slice(-6)}
                    </h3>
                    ${getStatusBadge(order.status)}
                </div>
                <div class="order-date">
                    <i class="far fa-clock"></i>
                    ${formatDate(order.createdAt)}
                </div>
            </div>

            <div class="order-body">
                <div class="customer-info">
                    <p>
                        <i class="fas fa-user"></i>
                        <strong>Klient:</strong> ${order.userId.username}
                    </p>
                    <p>
                        <i class="fas fa-map-marker-alt"></i>
                        <strong>Adres:</strong> ${order.address}
                    </p>
                    <p>
                        <i class="fas fa-credit-card"></i>
                        <strong>Płatność:</strong> ${order.paymentID}
                    </p>
                </div>

                <div class="order-products">
                    <h4>Produkty:</h4>
                    <div class="products-list">
                        ${order.products.map(p => `
                            <div class="product-item">
                                <span class="product-name">${p.name}</span>
                                <span class="product-quantity">${p.quantity} szt.</span>
                                <span class="product-price">${p.price.toFixed(2)} zł</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="order-footer">
                <div class="order-total">
                    <strong>Suma:</strong>
                    <span>${order.total.toFixed(2)} zł</span>
                </div>
                <div class="order-actions">
                    <button class="btn-status" onclick="updateOrderStatus('${order._id}')">
                        <i class="fas fa-sync-alt"></i>
                        Zmień status
                    </button>
                    <button class="btn-details" onclick="showOrderDetails('${order._id}')">
                        <i class="fas fa-eye"></i>
                        Szczegóły
                    </button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="no-orders">Brak zamówień</div>';
}

function updateOrdersCount(count) {
    const badge = document.getElementById('ordersCount');
    if (badge) {
        badge.textContent = count;
    }
}

document.getElementById('searchOrders')?.addEventListener('input', () => {
    fetchAllOrders();
});

document.getElementById('statusFilter')?.addEventListener('change', () => {
    fetchAllOrders();
});

document.getElementById('sortBy')?.addEventListener('change', () => {
    fetchAllOrders();
});

document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Czy na pewno chcesz się wylogować?')) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
});

fetchAllOrders();