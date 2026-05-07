document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.querySelector(".logout-btn");

        logoutBtn.addEventListener("click", () => {
            if(confirm("Are you sure you want to log out?")) {
                localStorage.clear();

                window.location.href = "/secret/admin-login.html";
            }
        });

        function switchTab(tabId, el) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById('tab-' + tabId).classList.add('active');
            el.classList.add('active');
            const titles = { users: 'User Accounts', staff: 'Staff Management', sales: 'Sales Report' };
            document.getElementById('topbar-title').textContent = titles[tabId];
            document.getElementById('table-label').textContent = titles[tabId];
            if (tabId === 'users') fetchUsers();
            if (tabId === 'staff') fetchStaff();
            if (tabId === 'sales') fetchSales();
        }

        // --- Update this inside your fetchUsers() function ---
        async function fetchUsers() {
            const res = await fetch('/admin/users');
            const data = await res.json();
            
            // ... (rest of your logic) ...

            const tbody = document.querySelector('#userTable tbody');
            tbody.innerHTML = data.map(u => `
                <tr>
                    <td class="td-id">#${u.user_id}</td>
                    <td class="td-name">${u.full_name}</td>
                    <td class="td-muted">${u.email}</td>
                    <td class="td-muted">${u.phone_number}</td>
                    <td>
                        <button class="btn-history" onclick="viewUserHistory(${u.user_id}, '${u.full_name}')">Orders</button>
                        <button class="btn-reset" onclick="resetPassword('user', ${u.user_id})">Reset</button>
                    </td>
                </tr>
            `).join('');
        }

        

        async function fetchStaff() {
            const res = await fetch('/admin/staff');
            const data = await res.json();
            document.getElementById('stat-staff').textContent = data.length;
            document.getElementById('pill-staff').textContent = data.length;
            document.getElementById('table-count').textContent = data.length + ' members';
            document.getElementById('card-staff').style.display = '';
            document.getElementById('card-deliveries').style.display = '';
            document.getElementById('stat-total').textContent = data.length;
            document.getElementById('stat-total-label').textContent = 'Total Staff';
            let totalDeliveries = 0;
            const tbody = document.querySelector('#staffTable tbody');
            tbody.innerHTML = data.map(s => {
                totalDeliveries += s.delivery_count;
                return `
                <tr>
                    <td class="td-id">#${s.staff_id}</td>
                    <td class="td-name">${s.full_name}</td>
                    <td class="td-muted">${s.email}</td>
                    <td><span class="delivery-badge">✓ ${s.delivery_count} completed</span></td>
                    <td>
                        <button class="btn-history" onclick="viewStaffHistory(${s.staff_id})">History</button>
                        <button class="btn-reset" onclick="resetPassword('staff', ${s.staff_id})">Reset Password</button>
                    </td>
                </tr>`;
            }).join('');
            document.getElementById('stat-deliveries').textContent = totalDeliveries;
        }

        async function resetPassword(type, id) {
            const newPass = prompt('Enter new password for this account:');
            if (!newPass) return;
            const res = await fetch('/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id, newPass })
            });
            const result = await res.json();
            alert(result.message || result.error);
        }

        async function viewStaffHistory(staffId) {
            const container = document.getElementById('historyContainer');
            container.innerHTML = '<div class="loading-text">Loading history…</div>';
            document.getElementById('historyModal').classList.add('open');
            try {
                const res = await fetch(`/admin/staff-history/${staffId}`);
                const orders = await res.json();
                if (orders.length === 0) {
                    container.innerHTML = '<div class="empty-text">No deliveries found for this staff member.</div>';
                    return;
                }
                container.innerHTML = orders.map(order => {
                    const orderNum = order.ORDER_NUMBER || order.order_number;
                    const totalPrice = order.TOTAL_PRICE || order.total_price || 0;
                    const createdAt = order.CREATED_AT || order.created_at;
                    const status = (order.STATUS || order.status || 'Unknown').toLowerCase();
                    const rawCart = order.CART_LIST || order.cart_list;
                    let items = [];
                    try {
                        items = typeof rawCart === 'string' ? JSON.parse(rawCart) : rawCart;
                        if (typeof items === 'string') items = JSON.parse(items);
                    } catch (e) { items = []; }
                    return `
                        <div class="history-card">
                            <div class="history-card-top">
                                <div class="history-order-num">Order #${orderNum}</div>
                                <div class="history-date">${new Date(createdAt).toLocaleString()}</div>
                            </div>
                            <div class="history-items">${items.map(i => `${i.name} × ${i.qty || 1}`).join('<br>')}</div>
                            <div class="history-footer">
                                <div class="history-total">₱${parseFloat(totalPrice).toLocaleString()}</div>
                                <div class="history-status">${status}</div>
                            </div>
                        </div>`;
                }).join('');
            } catch (err) {
                console.error(err);
                container.innerHTML = '<div class="error-text">Error loading history. Check console for details.</div>';
            }
        }

        function closeModal() {
            document.getElementById('historyModal').classList.remove('open');
        }

        document.getElementById('historyModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });

        function adminLogout() {
            localStorage.removeItem('admin_token');
            window.location.href = 'admin-login.html';
        }

        let salesChartInstance = null;

        async function fetchSales() {
            const now = new Date();
            const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            document.getElementById('chart-month-label').textContent = monthName;

            document.getElementById('card-staff').style.display = 'none';
            document.getElementById('card-deliveries').style.display = 'none';
            document.getElementById('stat-total-label').textContent = 'Total Orders';
            document.getElementById('table-count').textContent = '';

            try {
                const res = await fetch('/admin/sales-report');
                const data = await res.json();

                const totalOrders = data.total_orders || 0;
                const totalRevenue = data.total_revenue || 0;
                const avg = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

                document.getElementById('stat-total').textContent = totalOrders;
                document.getElementById('sales-orders').textContent = totalOrders;
                document.getElementById('sales-revenue').textContent = '₱' + parseFloat(totalRevenue).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                document.getElementById('sales-avg').textContent = '₱' + parseFloat(avg).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                const daily = data.daily || [];
                const labels = daily.map(d => d.day);
                const orderData = daily.map(d => d.orders);
                const revenueData = daily.map(d => d.revenue);

                renderSalesChart(labels, orderData, revenueData);

            } catch (err) {
                console.error('Sales fetch error:', err);
                renderSalesChart(generateDemoLabels(), generateDemoOrders(), generateDemoRevenue());
            }
        }

        function generateDemoLabels() {
            const days = [];
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) days.push(i);
            return days;
        }

        function generateDemoOrders() {
            return generateDemoLabels().map(() => Math.floor(Math.random() * 20 + 2));
        }

        function generateDemoRevenue() {
            return generateDemoOrders().map(o => o * (Math.random() * 300 + 200));
        }

        function renderSalesChart(labels, orderData, revenueData) {
            const ctx = document.getElementById('salesChart').getContext('2d');
            if (salesChartInstance) salesChartInstance.destroy();

            salesChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Orders',
                            data: orderData,
                            backgroundColor: 'rgba(212,63,51,0.75)',
                            borderColor: 'rgba(212,63,51,1)',
                            borderWidth: 1,
                            borderRadius: 4,
                            yAxisID: 'yOrders'
                        },
                        {
                            label: 'Revenue (₱)',
                            data: revenueData,
                            type: 'line',
                            borderColor: '#c5a059',
                            backgroundColor: 'rgba(197,160,89,0.1)',
                            borderWidth: 2,
                            pointBackgroundColor: '#c5a059',
                            pointRadius: 3,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'yRevenue'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                font: { family: 'DM Sans', size: 11 },
                                color: '#888880',
                                boxWidth: 10,
                                padding: 16
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#fff',
                            bodyColor: 'rgba(255,255,255,0.7)',
                            borderColor: 'rgba(212,63,51,0.4)',
                            borderWidth: 1,
                            padding: 10,
                            titleFont: { family: 'DM Sans', size: 12, weight: '500' },
                            bodyFont: { family: 'DM Sans', size: 11 },
                            callbacks: {
                                label: function(ctx) {
                                    if (ctx.dataset.label === 'Revenue (₱)') {
                                        return ' ₱' + parseFloat(ctx.raw).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    }
                                    return ' ' + ctx.raw + ' orders';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: { font: { family: 'DM Sans', size: 10 }, color: '#aaa' }
                        },
                        yOrders: {
                            type: 'linear',
                            position: 'left',
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            ticks: { font: { family: 'DM Sans', size: 10 }, color: '#d43f33', stepSize: 1 },
                            title: { display: true, text: 'Orders', color: '#d43f33', font: { size: 10, family: 'DM Sans' } }
                        },
                        yRevenue: {
                            type: 'linear',
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: {
                                font: { family: 'DM Sans', size: 10 },
                                color: '#c5a059',
                                callback: v => '₱' + v.toLocaleString()
                            },
                            title: { display: true, text: 'Revenue', color: '#c5a059', font: { size: 10, family: 'DM Sans' } }
                        }
                    }
                }
            });
        }

        

        fetchUsers();
});

// --- GLOBAL FUNCTIONS (Accessible by HTML onclick) ---

function closeModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function switchTab(tabName, btn) {
    // 1. Handle Button Active States
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    btn.classList.add('active');

    // 2. Handle Content Visibility
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // 3. Update Title
    const titleMap = {
        'users': 'User Accounts',
        'staff': 'Staff Management',
        'sales': 'Sales Report'
    };
    document.getElementById('topbar-title').textContent = titleMap[tabName];
}

async function adminLogout() {
    // Clear your session/token
    localStorage.removeItem('adminToken');
    // Redirect to login page
    window.location.href = 'admin-login.html'; 
}

async function viewUserHistory(userId, userName) {
    const container = document.getElementById('historyContainer');
    const modalTitle = document.querySelector('.modal-title');
    
    modalTitle.textContent = `Order History: ${userName}`;
    container.innerHTML = '<div class="loading-text">Loading orders...</div>';
    document.getElementById('historyModal').classList.add('open');

    try {
        const res = await fetch(`/admin/user-history/${userId}`);
        const orders = await res.json();

        // FIX: Check if orders is an array and has items
        if (!Array.isArray(orders)) {
            console.error("Expected array but got:", orders);
            container.innerHTML = `<div class="error-text">Unexpected data format from server.</div>`;
            return;
        }

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-text">No orders found for this user.</div>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const orderNum = order.ORDER_NUMBER || order.order_number;
            const totalPrice = order.TOTAL_PRICE || order.total_price || 0;
            const createdAt = order.CREATED_AT || order.created_at;
            const status = (order.STATUS || order.status || 'Unknown').toLowerCase();
            const rawCart = order.CART_LIST || order.cart_list;
            
            let items = [];
            try {
                items = typeof rawCart === 'string' ? JSON.parse(rawCart) : rawCart;
                if (!Array.isArray(items)) items = []; 
            } catch (e) { items = []; }

            return `
                <div class="history-card">
                    <div class="history-card-top">
                        <div class="history-order-num">Order #${orderNum}</div>
                        <div class="history-date">${new Date(createdAt).toLocaleString()}</div>
                    </div>
                    <div class="history-items">
                        ${items.map(i => `${i.name} × ${i.qty || 1}`).join('<br>')}
                    </div>
                    <div class="history-footer">
                        <div class="history-total">₱${parseFloat(totalPrice).toLocaleString()}</div>
                        <div class="history-status">${status}</div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = '<div class="error-text">Error connecting to server.</div>';
    }
}