// ============================================
// RestNest Admin — Application Logic
// ============================================

const API_BASE = 'https://restienestie.onrender.com';
const POLL_INTERVAL = 10000; // 10 seconds

const SUPABASE_URL = 'https://julktcdhbnvxsjuqsimp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bGt0Y2RoYm52eHNqdXFzaW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjUxOTAsImV4cCI6MjEwMjMwMTE5MH0.W6Jov4LGiSRnyOyG9h4xwYLHc6kZawR63EmyQd52Goo';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let adminSession = null;


// ── State ──
let state = {
    currentTab: 'dashboard',
    orders: [],
    bulkOrders: [],
    contactMessages: [],
    customers: [],
    pageTraffic: [],
    reviews: [],
    selectedOrder: null,
    timeRange: 'All Time',
    isDark: true,
    isLoading: true,
    salesChart: null,
    trafficChart: null,
    pollTimer: null
};

// ── Icons (inline SVG strings) ──
const ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    bulk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    contact: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    person: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    creditCard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    shoppingCart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    dropDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
};

// ── Chart Colors ──
const CHART_COLORS = ['#00E5FF', '#FF6B6B', '#FFC107', '#4CAF50', '#AB47BC', '#42A5F5', '#FF7043', '#26A69A'];

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    if (localStorage.getItem('admin_logged_in') === 'true') {
        initAdminApp();
    } else {
        renderLogin();
    }
});

window.handleAdminLogout = function() {
    localStorage.removeItem('admin_logged_in');
    if (state.pollTimer) clearInterval(state.pollTimer);
    renderLogin();
}

function initAdminApp() {
    renderShell();
    navigate('dashboard');
    startPolling();
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.time-dropdown')) {
            document.querySelectorAll('.time-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        }
        if (!e.target.closest('.status-dropdown')) {
            document.querySelectorAll('.status-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        }
    });
}

function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="login-wrapper">
            <div class="login-box">
                <h1 style="text-align: center; margin-bottom: 20px;">Admin Login</h1>
                <p id="login-error" style="color: red; text-align: center; margin-bottom: 10px;"></p>
                <div style="margin-bottom: 10px;">
                    <label>Username</label>
                    <input type="text" id="admin-username" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; background: var(--bg-main); color: var(--text-main);">
                </div>
                <div style="margin-bottom: 20px;">
                    <label>Password</label>
                    <input type="password" id="admin-password" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; background: var(--bg-main); color: var(--text-main);">
                </div>
                <button onclick="handleAdminLogin()" style="width: 100%; padding: 10px; background: #0077CC; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Login</button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.innerHTML = `
        .login-wrapper { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: var(--bg-main); }
        .login-box { background: var(--bg-card); padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .login-box label { display: block; margin-bottom: 5px; color: var(--text-main); font-weight: 500; }
    `;
    document.head.appendChild(style);
}

window.handleAdminLogin = async function() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = 'Logging in...';
    
    if (username === 'Admin' && password === 'chirag.restnest.1313') {
        errorEl.textContent = 'Success!';
        localStorage.setItem('admin_logged_in', 'true');
        initAdminApp();
    } else {
        errorEl.textContent = 'Invalid username or password.';
    }
}

// ── Theme ──
function loadTheme() {
    const saved = localStorage.getItem('rn-admin-theme');
    state.isDark = saved ? saved === 'dark' : true;
    applyTheme();
}

function toggleTheme() {
    state.isDark = !state.isDark;
    localStorage.setItem('rn-admin-theme', state.isDark ? 'dark' : 'light');
    applyTheme();
    // Re-render charts with new colors
    if (state.currentTab === 'dashboard') renderDashboardCharts();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.checked = state.isDark;
}

// ── Navigation ──
function navigate(tab) {
    state.currentTab = tab;
    
    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
    
    const content = document.getElementById('main-content');
    content.innerHTML = '';
    content.classList.remove('fade-in');
    void content.offsetWidth; // trigger reflow
    content.classList.add('fade-in');
    
    switch (tab) {
        case 'dashboard': renderDashboard(); break;
        case 'orders': renderOrders(); break;
        case 'customers': renderCustomers(); break;
        case 'bulk': renderBulk(); break;
        case 'contact': renderContactMessages(); break;
        case 'reviews': renderReviews(); break;
        case 'settings': renderSettings(); break;
    }
}

// ── Data Fetching ──
async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/orders`);
        const data = await res.json();
        if (data.success) {
            state.orders = data.orders || [];
        }
    } catch (err) {
        console.error('Failed to fetch orders:', err);
    }
    state.isLoading = false;
}

async function fetchCustomers() {
    try {
        const res = await fetch(`${API_BASE}/api/customers`);
        const data = await res.json();
        if (data.success) {
            state.customers = data.customers || [];
        }
    } catch (err) {
        console.error('Failed to fetch customers:', err);
    }
}

async function fetchBulkOrders() {
    try {
        const res = await fetch(`${API_BASE}/api/bulk-orders`);
        const data = await res.json();
        if (data.success) {
            state.bulkOrders = data.bulkOrders || [];
        }
    } catch (err) {
        console.error('Failed to fetch bulk orders:', err);
    }
}

async function fetchContactMessages() {
    try {
        const res = await fetch(`${API_BASE}/api/contact`);
        const data = await res.json();
        if (data.success) {
            state.contactMessages = data.contacts || [];
        }
    } catch (err) {
        console.error('Failed to fetch contact messages:', err);
    }
}

async function fetchReviews() {
    try {
        const res = await fetch(`${API_BASE}/api/reviews`);
        const data = await res.json();
        if (data.success) {
            state.reviews = data.reviews || [];
        }
    } catch (err) {
        console.error('Failed to fetch reviews:', err);
    }
}

async function fetchPageTraffic() {
    try {
        const res = await fetch(`${API_BASE}/api/page-traffic`);
        const data = await res.json();
        if (data.success) {
            state.pageTraffic = data.traffic || [];
        }
    } catch (err) {
        console.error('Failed to fetch page traffic:', err);
    }
}

async function resetPageTraffic() {
    if (!confirm('Are you sure you want to reset all page traffic data?')) return;
    try {
        await fetch(`${API_BASE}/api/reset-traffic`, { method: 'POST' });
        state.pageTraffic = [];
        if (state.currentTab === 'dashboard') renderDashboard();
    } catch (err) {
        console.error('Failed to reset traffic:', err);
    }
}

async function updateOrderStatus(id, status) {
    try {
        await fetch(`${API_BASE}/api/update-order-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const order = state.orders.find(o => o.id === id);
        if (order) order.status = status;
    } catch (err) {
        console.error('Failed to update status:', err);
    }
}

async function deleteOrder(id) {
    try {
        await fetch(`${API_BASE}/api/delete-order/${id}`, { method: 'DELETE' });
        state.orders = state.orders.filter(o => o.id !== id);
    } catch (err) {
        console.error('Failed to delete order:', err);
    }
}

// ── Polling ──
function startPolling() {
    fetchOrders().then(() => {
        fetchBulkOrders();
        fetchContactMessages();
        fetchCustomers();
        fetchReviews();
        fetchPageTraffic().then(() => {
            if (state.currentTab === 'dashboard') renderDashboard();
            else if (state.currentTab === 'orders') renderOrders();
            else if (state.currentTab === 'customers') renderCustomers();
            else if (state.currentTab === 'bulk') renderBulk();
            else if (state.currentTab === 'contact') renderContactMessages();
            else if (state.currentTab === 'reviews') renderReviews();
        });
    });
    
    state.pollTimer = setInterval(async () => {
        await fetchOrders();
        await fetchBulkOrders();
        await fetchContactMessages();
        await fetchCustomers();
        await fetchReviews();
        await fetchPageTraffic();
        if (state.currentTab === 'dashboard') renderDashboard();
        else if (state.currentTab === 'orders') renderOrders();
        else if (state.currentTab === 'customers') renderCustomers();
        else if (state.currentTab === 'bulk') renderBulk();
        else if (state.currentTab === 'contact') renderContactMessages();
        else if (state.currentTab === 'reviews') renderReviews();
    }, POLL_INTERVAL);
}

// ── Render Shell ──
function renderShell() {
    document.getElementById('app').innerHTML = `
        <div class="app-layout">
            <aside class="sidebar">
                <div class="sidebar-brand">
                    <h1>RestNest</h1>
                    <span>Admin Panel</span>
                </div>
                <nav class="sidebar-nav">
                    <button class="nav-item active" data-tab="dashboard" onclick="navigate('dashboard')">
                        <span class="nav-icon">${ICONS.dashboard}</span>
                        Dashboard
                    </button>
                    <button class="nav-item" data-tab="orders" onclick="navigate('orders')">
                        <span class="nav-icon">${ICONS.orders}</span>
                        Orders
                    </button>
                    <button class="nav-item" data-tab="customers" onclick="navigate('customers')">
                        <span class="nav-icon">${ICONS.customers}</span>
                        Customers
                    </button>
                    <button class="nav-item" data-tab="bulk" onclick="navigate('bulk')">
                        <span class="nav-icon">${ICONS.bulk}</span>
                        Bulk Requests
                    </button>
                    <button class="nav-item" data-tab="contact" onclick="navigate('contact')">
                        <span class="nav-icon">${ICONS.contact}</span>
                        Contacts
                    </button>
                    <button class="nav-item" data-tab="reviews" onclick="navigate('reviews')">
                        <span class="nav-icon">${ICONS.star}</span>
                        Reviews
                    </button>
                    <button class="nav-item" data-tab="settings" onclick="navigate('settings')">
                        <span class="nav-icon">${ICONS.settings}</span>
                        Settings
                    </button>
                </nav>
                <div class="sidebar-footer">
                    <div style="font-size:0.75rem;color:var(--text-secondary);">RestNest Admin v2.0</div>
                </div>
            </aside>

            <main class="main-content fade-in" id="main-content">
                <div class="spinner-wrapper"><div class="spinner"></div></div>
            </main>

            <nav class="mobile-nav">
                <button class="mobile-nav-item active" data-tab="dashboard" onclick="navigate('dashboard')">
                    ${ICONS.dashboard}
                    <span>Dashboard</span>
                </button>
                <button class="mobile-nav-item" data-tab="orders" onclick="navigate('orders')">
                    ${ICONS.orders}
                    <span>Orders</span>
                </button>
                <button class="mobile-nav-item" data-tab="customers" onclick="navigate('customers')">
                    ${ICONS.customers}
                    <span>Customers</span>
                </button>
                <button class="mobile-nav-item" data-tab="bulk" onclick="navigate('bulk')">
                    ${ICONS.bulk}
                    <span>Bulk</span>
                </button>
                <button class="mobile-nav-item" data-tab="contact" onclick="navigate('contact')">
                    ${ICONS.contact}
                    <span>Contacts</span>
                </button>
                <button class="mobile-nav-item" data-tab="reviews" onclick="navigate('reviews')">
                    ${ICONS.star}
                    <span>Reviews</span>
                </button>
                <button class="mobile-nav-item" data-tab="settings" onclick="navigate('settings')">
                    ${ICONS.settings}
                    <span>Settings</span>
                </button>
            </nav>
        </div>

        <!-- Order Detail Modal -->
        <div class="order-detail-overlay" id="order-detail-overlay" onclick="if(event.target===this)closeOrderDetail()"></div>
    `;
}

// ── Helpers ──
function getFilteredOrders() {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    return state.orders.filter(o => {
        const created = o.created_at || 0;
        switch (state.timeRange) {
            case 'This Week': return (now - created) <= oneWeek;
            case 'This Month': return (now - created) <= oneMonth;
            default: return true;
        }
    });
}

function formatCurrency(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function statusClass(s) {
    return (s || '').toLowerCase();
}

// ══════════════════════ DASHBOARD ══════════════════════
function renderDashboard() {
    const filtered = getFilteredOrders();
    const totalSales = filtered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = filtered.length;

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="page-header">
            <h2>Dashboard</h2>
            <div class="page-header-actions">
                <div class="time-dropdown">
                    <button class="time-dropdown-btn" onclick="this.nextElementSibling.classList.toggle('open')">
                        ${state.timeRange}
                        <span style="width:14px;height:14px;">${ICONS.dropDown}</span>
                    </button>
                    <div class="time-dropdown-menu" id="time-menu">
                        ${['This Week', 'This Month', 'All Time'].map(r => `
                            <button class="${state.timeRange === r ? 'active' : ''}" onclick="state.timeRange='${r}';renderDashboard();">${r}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">${ICONS.shoppingCart}</div>
                <div class="stat-label">Total Sales</div>
                <div class="stat-value">${formatCurrency(totalSales)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">${ICONS.checkCircle}</div>
                <div class="stat-label">Orders</div>
                <div class="stat-value">${totalOrders}</div>
            </div>
        </div>

        <div class="chart-section">
            <div class="chart-section-header">
                <h3>Sales by Product</h3>
            </div>
            <div class="chart-card">
                <div class="chart-container">
                    <canvas id="sales-chart"></canvas>
                </div>
            </div>
        </div>

        <div class="chart-section">
            <div class="chart-section-header">
                <h3>Page Traffic</h3>
            </div>
            <div class="chart-card">
                <div class="chart-container">
                    <canvas id="traffic-chart"></canvas>
                </div>
            </div>
        </div>
    `;

    renderDashboardCharts();
}

function renderDashboardCharts() {
    const filtered = getFilteredOrders();
    
    // Parse product sales from rawItems / items
    const salesMap = {};
    filtered.forEach(order => {
        try {
            const items = JSON.parse(order.items || '[]');
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const name = item.name || 'Unknown';
                    const price = Number(item.price || 0);
                    const qty = Number(item.quantity || 1);
                    salesMap[name] = (salesMap[name] || 0) + (price * qty);
                });
            }
        } catch (e) {
            // items might be a string description, skip
        }
    });

    const productNames = Object.keys(salesMap);
    const productValues = Object.values(salesMap);

    const accentColor = state.isDark ? '#00E5FF' : '#0077CC';
    const textColor = state.isDark ? '#AAAAAA' : '#666680';
    const gridColor = state.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    // Sales chart
    const salesCtx = document.getElementById('sales-chart');
    if (salesCtx) {
        if (state.salesChart) state.salesChart.destroy();
        state.salesChart = new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: productNames.length ? productNames : ['No data'],
                datasets: [{
                    label: 'Sales (Rs.)',
                    data: productValues.length ? productValues : [0],
                    backgroundColor: productNames.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'CC'),
                    borderColor: productNames.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: state.isDark ? '#1A1A2E' : '#fff',
                        titleColor: state.isDark ? '#fff' : '#1A1A2E',
                        bodyColor: state.isDark ? '#AAA' : '#666',
                        borderColor: state.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ' Rs. ' + Number(ctx.raw).toLocaleString('en-IN')
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 11 }, callback: v => 'Rs.' + (v/1000).toFixed(0) + 'k' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 12, weight: 500 } }
                    }
                }
            }
        });
    }

    // Page traffic chart using real data
    const trafficData = state.pageTraffic.length ? state.pageTraffic : [
        { page: 'No data', visits: 0 }
    ];

    const trafficCtx = document.getElementById('traffic-chart');
    if (trafficCtx) {
        if (state.trafficChart) state.trafficChart.destroy();
        state.trafficChart = new Chart(trafficCtx, {
            type: 'bar',
            data: {
                labels: trafficData.map(d => d.page),
                datasets: [{
                    label: 'Visits',
                    data: trafficData.map(d => d.visits),
                    backgroundColor: trafficData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'AA'),
                    borderColor: trafficData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.55
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: state.isDark ? '#1A1A2E' : '#fff',
                        titleColor: state.isDark ? '#fff' : '#1A1A2E',
                        bodyColor: state.isDark ? '#AAA' : '#666',
                        borderColor: state.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ' ' + ctx.raw.toLocaleString() + ' visits'
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 11 } },
                        beginAtZero: true
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 12, weight: 500 } }
                    }
                }
            }
        });
    }
}

// ══════════════════════ ORDERS ══════════════════════
function renderOrders() {
    const content = document.getElementById('main-content');

    if (state.isLoading && !state.orders.length) {
        content.innerHTML = `
            <div class="page-header"><h2>Live Orders</h2></div>
            <div class="spinner-wrapper"><div class="spinner"></div></div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="page-header">
            <h2>Live Orders</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchOrders().then(()=>renderOrders())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.orders.length ? `
        <div class="orders-table-wrapper">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>User Type</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.orders.map(order => `
                        <tr onclick="openOrderDetail('${order.id}')">
                            <td class="order-id">#${(order.id || '').slice(-6)}</td>
                            <td>${escapeHtml(order.customer_name || '')}</td>
                            <td>${order.user_id ? '<span style="background:var(--success);color:white;padding:2px 6px;border-radius:4px;font-size:0.7rem;">Registered</span>' : '<span style="background:#aaa;color:white;padding:2px 6px;border-radius:4px;font-size:0.7rem;">Guest</span>'}</td>
                            <td class="order-amount">${formatCurrency(order.total_amount)}</td>
                            <td>
                                <div class="status-dropdown" onclick="event.stopPropagation()">
                                    <span class="status-badge ${statusClass(order.status)}" onclick="this.nextElementSibling.classList.toggle('open')">
                                        ${order.status || 'Placed'}
                                        <span class="badge-arrow">▼</span>
                                    </span>
                                    <div class="status-dropdown-menu">
                                        ${['Placed', 'Shipped', 'Delivered'].map(s => `
                                            <button onclick="handleStatusChange('${order.id}','${s}');this.closest('.status-dropdown-menu').classList.remove('open')">${s}</button>
                                        `).join('')}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.orders}
            <p>No orders yet</p>
        </div>
        `}
    `;
}

async function handleStatusChange(id, status) {
    await updateOrderStatus(id, status);
    renderOrders();
}

function openOrderDetail(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) return;
    state.selectedOrder = order;

    const sc = statusClass(order.status);
    const statusColorMap = { placed: '#FFC107', shipped: '#42A5F5', delivered: '#4CAF50' };
    const statusColor = statusColorMap[sc] || '#AAA';

    let actionsHtml = '';
    if (order.status === 'Placed') {
        actionsHtml = `<button class="action-btn ship" onclick="handleDetailAction('${order.id}','Shipped')">${ICONS.send} Mark Shipped</button>`;
    } else if (order.status === 'Shipped') {
        actionsHtml = `<button class="action-btn deliver" onclick="handleDetailAction('${order.id}','Delivered')">${ICONS.checkCircle} Mark Delivered</button>`;
    } else if (order.status === 'Delivered') {
        actionsHtml = `<button class="action-btn delete" onclick="handleDetailDelete('${order.id}')">${ICONS.trash} Delete Order</button>`;
    }

    // Parse items
    let itemsText = '';
    try {
        const items = JSON.parse(order.items || '[]');
        if (Array.isArray(items)) {
            itemsText = items.map(i => `${i.name} × ${i.quantity} — Rs. ${Number(i.price * i.quantity).toLocaleString('en-IN')}`).join('<br>');
        }
    } catch (e) {
        itemsText = order.items || 'N/A';
    }

    const overlay = document.getElementById('order-detail-overlay');
    overlay.innerHTML = `
        <div class="order-detail-panel">
            <div class="detail-header">
                <h3>Order Details</h3>
                <button class="detail-close" onclick="closeOrderDetail()">${ICONS.close}</button>
            </div>

            <div class="detail-status-bar ${sc}">
                <div class="detail-status-dot ${sc}"></div>
                <div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);">Current Status</div>
                    <div style="font-size:1.1rem;font-weight:700;color:${statusColor}">${order.status || 'Placed'}</div>
                </div>
            </div>

            <div class="detail-actions">${actionsHtml}</div>

            <div class="detail-info-card">
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.info}</span>
                    <div>
                        <div class="info-label">Order ID</div>
                        <div class="info-value" style="font-weight:700">${order.id}</div>
                    </div>
                </div>
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.person}</span>
                    <div>
                        <div class="info-label">Customer</div>
                        <div class="info-value">${escapeHtml(order.customer_name || '')}</div>
                    </div>
                </div>
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.phone}</span>
                    <div>
                        <div class="info-label">Contact</div>
                        <div class="info-value">${escapeHtml(order.phone || '')}</div>
                    </div>
                </div>
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.mapPin}</span>
                    <div>
                        <div class="info-label">Shipping Address</div>
                        <div class="info-value">${escapeHtml(order.address || '')}</div>
                    </div>
                </div>
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.creditCard}</span>
                    <div>
                        <div class="info-label">Payment</div>
                        <div class="info-value">${escapeHtml(order.payment_method || 'Razorpay')} • ID: ${escapeHtml(order.payment_id || 'N/A')}</div>
                    </div>
                </div>
                <div class="detail-info-row">
                    <span class="info-icon">${ICONS.truck}</span>
                    <div>
                        <div class="info-label">Shiprocket AWB</div>
                        <div class="info-value" style="font-weight:700">${escapeHtml(order.shiprocket_awb || 'N/A')}</div>
                    </div>
                </div>
            </div>

            <div class="detail-summary-card">
                <div class="detail-summary-title">Order Summary</div>
                <div class="detail-items-text">${itemsText}</div>
                <div class="detail-total-row">
                    <span class="detail-total-label">Total Amount</span>
                    <span class="detail-total-value">${formatCurrency(order.total_amount)}</span>
                </div>
            </div>
        </div>
    `;
    overlay.classList.add('open');
}

function closeOrderDetail() {
    document.getElementById('order-detail-overlay').classList.remove('open');
    state.selectedOrder = null;
}

async function handleDetailAction(id, status) {
    await updateOrderStatus(id, status);
    closeOrderDetail();
    renderOrders();
}

async function handleDetailDelete(id) {
    if (confirm('Are you sure you want to delete this order?')) {
        await deleteOrder(id);
        closeOrderDetail();
        renderOrders();
    }
}

// ══════════════════════ CUSTOMERS ══════════════════════
function renderCustomers() {
    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="page-header">
            <h2>Customers</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchCustomers().then(()=>renderCustomers())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.customers.length ? `
        <div class="orders-table-wrapper">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Addresses</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.customers.map(c => `
                        <tr>
                            <td class="order-id" style="font-size: 0.8rem;">${(c.user_id || '').substring(0,8)}...</td>
                            <td>${escapeHtml(c.first_name || '')} ${escapeHtml(c.last_name || '')}</td>
                            <td>${escapeHtml(c.phone || 'N/A')}</td>
                            <td>${c.addresses && c.addresses.length ? c.addresses.length : 0} saved</td>
                            <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.customers}
            <p>No registered customers yet</p>
        </div>
        `}
    `;
}

// ══════════════════════ CUSTOMERS ══════════════════════
function renderCustomers() {
    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="page-header">
            <h2>Customers</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchCustomers().then(()=>renderCustomers())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.customers.length ? `
        <div class="orders-table-wrapper">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Addresses</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.customers.map(c => `
                        <tr>
                            <td class="order-id" style="font-size: 0.8rem;">${(c.user_id || '').substring(0,8)}...</td>
                            <td>${escapeHtml(c.first_name || '')} ${escapeHtml(c.last_name || '')}</td>
                            <td>${escapeHtml(c.phone || 'N/A')}</td>
                            <td>${c.addresses && c.addresses.length ? c.addresses.length : 0} saved</td>
                            <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.customers}
            <p>No registered customers yet</p>
        </div>
        `}
    `;
}

// ══════════════════════ BULK ORDERS ══════════════════════
function renderBulk() {
    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="page-header">
            <h2>Bulk Requests</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchBulkOrders().then(()=>renderBulk())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.bulkOrders.length ? `
        <div class="bulk-grid">
            ${state.bulkOrders.map(order => `
                <div class="bulk-card">
                    <div class="bulk-card-header">
                        <span class="bulk-card-id">${escapeHtml(order.id || '')}</span>
                        <span class="status-badge ${order.status === 'Pending' ? 'placed' : 'delivered'}">${order.status || 'Pending'}</span>
                    </div>
                    <div class="bulk-card-business">${escapeHtml(order.business_name || 'N/A')}</div>
                    <span class="bulk-card-qty">Qty: ${order.quantity || 0}</span>
                    <div class="bulk-card-contact">
                        <span>👤 ${escapeHtml((order.first_name || '') + ' ' + (order.last_name || ''))}</span>
                        <span>📧 ${escapeHtml(order.email || '')}</span>
                        <span>📞 ${escapeHtml(order.phone || '')}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.bulk}
            <p>No bulk requests yet</p>
        </div>
        `}
    `;
}

// ══════════════════════ CONTACT MESSAGES ══════════════════════
function renderContactMessages() {
    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="page-header">
            <h2>Contact Messages</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchContactMessages().then(()=>renderContactMessages())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.contactMessages.length ? `
        <div class="bulk-grid">
            ${state.contactMessages.map(msg => `
                <div class="bulk-card">
                    <div class="bulk-card-header">
                        <span class="bulk-card-id">${escapeHtml(msg.id || '')}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="bulk-card-business">${escapeHtml(msg.company || 'No Company')}</div>
                    <div style="margin-top: 0.5rem; color: var(--text-main); font-size: 0.95rem; white-space: pre-wrap;">${escapeHtml(msg.message || '')}</div>
                    <div class="bulk-card-contact" style="margin-top: 1rem;">
                        <span>👤 ${escapeHtml(msg.name || '')}</span>
                        <span>📧 ${escapeHtml(msg.email || '')}</span>
                        <span>📞 ${escapeHtml(msg.phone || '')}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.contact}
            <p>No contact messages yet</p>
        </div>
        `}
    `;
}

// ══════════════════════ REVIEWS ══════════════════════
function renderReviews() {
    const content = document.getElementById('main-content');

    content.innerHTML = `
        <div class="page-header">
            <h2>Product Reviews</h2>
            <div class="page-header-actions">
                <button class="btn-icon" onclick="fetchReviews().then(()=>renderReviews())" title="Refresh">
                    ${ICONS.refresh}
                </button>
            </div>
        </div>

        ${state.reviews.length ? `
        <div class="bulk-grid">
            ${state.reviews.map(r => `
                <div class="bulk-card">
                    <div class="bulk-card-header">
                        <span class="bulk-card-id">${escapeHtml(r.product_id || 'Unknown')}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="bulk-card-business">${escapeHtml(r.reviewer_name || 'Anonymous')}</div>
                    <div style="color: #FFC107; font-size: 1.2rem; margin-top: 0.5rem;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
                    <div style="margin-top: 0.5rem; color: var(--text-main); font-size: 0.95rem; white-space: pre-wrap;">"${escapeHtml(r.review_text || '')}"</div>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: ${r.status === 'Approved' ? 'var(--success)' : 'var(--warning)'}; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                        Status: ${r.status || 'Approved'}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            ${ICONS.star}
            <p>No reviews yet</p>
        </div>
        `}
    `;
}

// ══════════════════════ SETTINGS ══════════════════════
function renderSettings() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="page-header">
            <h2>Settings</h2>
        </div>

        <div class="settings-card">
            <div class="settings-card-left">
                <div class="settings-icon">${ICONS.moon}</div>
                <div>
                    <div class="settings-label">Dark Theme</div>
                    <div class="settings-desc">${state.isDark ? 'Currently using dark mode' : 'Currently using light mode'}</div>
                </div>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="theme-toggle" ${state.isDark ? 'checked' : ''} onchange="toggleTheme()">
                <span class="toggle-slider"></span>
            </label>
        </div>

        <div class="settings-card">
            <div class="settings-card-left">
                <div class="settings-icon">${ICONS.info}</div>
                <div>
                    <div class="settings-label">RestNest Admin</div>
                    <div class="settings-desc">Version 2.0 — Web Dashboard</div>
                </div>
            </div>
        </div>

        <div class="settings-card">
            <div class="settings-card-left">
                <div class="settings-icon" style="color: var(--danger); background: rgba(239, 83, 80, 0.1);">${ICONS.trash}</div>
                <div>
                    <div class="settings-label">Logout</div>
                    <div class="settings-desc">Sign out of the admin panel</div>
                </div>
            </div>
            <button class="action-btn delete" style="padding: 0.5rem 1rem; border:none; border-radius:6px; background:var(--danger); color:white; font-weight:600; font-family:var(--font);" onclick="handleAdminLogout()">Logout</button>
        </div>
    `;

}

// ── Utility ──
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
