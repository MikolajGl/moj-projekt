const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

// Token verification
let payload;
try {
    payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userName').textContent = payload.username || 'Administrator';
} catch (err) {
    alert('Błędny token. Zaloguj się ponownie.');
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

if (payload.role !== 'admin') {
    alert('Brak dostępu: tylko dla admina');
    window.location.href = '/main.html';
}

// Last login time
const lastLogin = localStorage.getItem('lastLoginTime') || new Date().toISOString();
document.getElementById('lastLoginTime').textContent = new Date(lastLogin).toLocaleString('pl-PL');
localStorage.setItem('lastLoginTime', new Date().toISOString());

// Dashboard stats update
async function updateDashboardStats() {
    try {
        const stats = await fetchStats();
        
        document.getElementById('totalOrders').textContent = stats.orders || 0;
        document.getElementById('totalProducts').textContent = stats.products || 0;
        document.getElementById('totalUsers').textContent = stats.users || 0;
        document.getElementById('totalComplaints').textContent = stats.complaints || 0;

        // Update badges in navigation
        document.getElementById('ordersCount').textContent = stats.pendingOrders || 0;
        document.getElementById('productsCount').textContent = stats.products || 0;
        document.getElementById('complaintsCount').textContent = stats.pendingComplaints || 0;
        document.getElementById('cartCount').textContent = stats.cartItems || 0;
    } catch (error) {
        console.error('Błąd podczas aktualizacji statystyk:', error);
    }
}

// Fetch statistics from API
async function fetchStats() {
    try {
        const response = await fetch('http://localhost:3001/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {
            orders: 0,
            products: 0,
            users: 0,
            complaints: 0,
            pendingOrders: 0,
            pendingComplaints: 0,
            cartItems: 0
        };
    }
}

// Logout handler
document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Czy na pewno chcesz się wylogować?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('lastLoginTime');
        window.location.href = '/login.html';
    }
});

// Initialize dashboard
function initDashboard() {
    updateDashboardStats();
    // Update stats every minute
    setInterval(updateDashboardStats, 60000);
}

// Stats cards animations
const statsCards = document.querySelectorAll('.stats-card');
statsCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Quick actions buttons effects
const actionButtons = document.querySelectorAll('.action-button');
actionButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
});

// Start the dashboard
document.addEventListener('DOMContentLoaded', initDashboard);