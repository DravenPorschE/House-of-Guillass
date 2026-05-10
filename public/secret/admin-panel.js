document.addEventListener("DOMContentLoaded", () => {


    const logoutBtn = document.querySelector(".logout-btn");

        logoutBtn.addEventListener("click", () => {
            if(confirm("Are you sure you want to log out?")) {
                localStorage.clear();

                window.location.href = "/secret/admin-login.html";
            }
        });

        async function fetchUsers() {
            document.getElementById("tab-inventory").style.display = "none";
            try {
                const res = await fetch('/admin/users');
                const data = await res.json(); // Assuming 'data' is an array of users

                // 1. Update the Count UI Elements
                const userCount = data.length;
                
                // The top-right pill
                if (document.getElementById("pill-users")) {
                    document.getElementById("pill-users").textContent = userCount;
                }
                
                // The main Overview stat card
                if (document.getElementById("stat-total")) {
                    document.getElementById("stat-total").textContent = userCount;
                    document.getElementById('stat-total-label').textContent = 'Total Accounts';
                }
                
                // The label above the table
                if (document.getElementById("table-count")) {
                    document.getElementById("table-count").textContent = userCount + ' accounts';
                }

                // 2. Manage Card Visibility
                document.getElementById("card-staff").style.display = "none";
                document.getElementById("card-deliveries").style.display = "none";
                document.getElementById("card-inventory").style.display = "none";
                document.getElementById("card-users").style.display = ""; // Ensure users card is visible

                // 3. Render the Table
                const tbody = document.querySelector('#userTable tbody');
                if (tbody) {
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
            } catch (err) {
                console.error("Error fetching users:", err);
            }
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
    
    fetchUsers();
    checkLowStock();
});


async function checkLowStock() {
    try {
        const res = await fetch('/food');
        const data = await res.json();

        const lowStockItems = data.filter(s => s.available_stock !== null && s.available_stock < 10);

        if (lowStockItems.length > 0) {
            lowStockItems.forEach((item, i) => {
                setTimeout(() => {
                    showToast(
                        'Low Stock Alert',
                        `<strong>${item.food_name}</strong> only has ${item.available_stock} left in stock.`,
                        'warning',
                        7000
                    );
                }, i * 400);
            });
        }
    } catch (err) {
        console.error('Stock check failed:', err);
    }
}

// ── TOAST SYSTEM ──
function showToast(title, message, type = 'warning', duration = 5000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { warning: '⚠️', success: '✅', error: '🚨', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '⚠️'}</span>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
        <button class="toast-close" onclick="dismissToast(this.closest('.toast'))">×</button>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;

    return toast;
}

function dismissToast(toast) {
    if (!toast || toast.classList.contains('removing')) return;
    clearTimeout(toast._timer);
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// --- GLOBAL FUNCTIONS (Accessible by HTML onclick) ---

function closeModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

let salesChartInstance = null;

        

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



function switchTab(tabId, el) {
            // alert("Switching");
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById('tab-' + tabId).classList.add('active');
            el.classList.add('active');
            const titles = { users: 'User Accounts', staff: 'Staff Management', sales: 'Sales Report',  inventory: 'Inventory Management' };
            document.getElementById('topbar-title').textContent = titles[tabId];
            document.getElementById('table-label').textContent = titles[tabId];
            if (tabId === 'users') fetchUsers();
            if (tabId === 'staff') fetchStaff();
            if (tabId === 'sales') fetchSales();
            if (tabId === 'inventory') fetchInventory();
        }

// --- Update this inside your fetchUsers() function ---
async function fetchUsers() {
    document.getElementById("table-count").style.display = "";
    document.querySelector(".button-inventory").style.display = "none";
    document.getElementById("tab-inventory").style.display = "none";
            try {
                const res = await fetch('/admin/users');
                const data = await res.json(); // Assuming 'data' is an array of users

                // 1. Update the Count UI Elements
                const userCount = data.length;
                
                // The top-right pill
                if (document.getElementById("pill-users")) {
                    document.getElementById("pill-users").textContent = userCount;
                }
                
                // The main Overview stat card
                if (document.getElementById("stat-total")) {
                    document.getElementById("stat-total").textContent = userCount;
                    document.getElementById('stat-total-label').textContent = 'Total Accounts';
                }
                
                // The label above the table
                if (document.getElementById("table-count")) {
                    document.getElementById("table-count").textContent = userCount + ' accounts';
                }

                // 2. Manage Card Visibility
                document.getElementById("card-staff").style.display = "none";
                document.getElementById("card-deliveries").style.display = "none";
                document.getElementById("card-inventory").style.display = "none";
                document.getElementById("card-users").style.display = ""; // Ensure users card is visible

                // 3. Render the Table
                const tbody = document.querySelector('#userTable tbody');
                if (tbody) {
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
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }        

async function fetchStaff() {
        document.getElementById("table-count").style.display = "";
        document.getElementById("tab-inventory").style.display = "none";
        document.querySelector(".button-inventory").style.display = "none";

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

async function fetchSales() {
            const now = new Date();
            const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            document.getElementById('chart-month-label').textContent = monthName;

            document.getElementById('card-staff').style.display = 'none';
            document.getElementById('card-deliveries').style.display = 'none';
            document.getElementById('stat-total-label').textContent = 'Total Orders';
            document.getElementById('table-count').textContent = '';
            
            document.getElementById("card-users").style.display = "";
            document.getElementById("card-inventory").style.display = "none";
            document.getElementById("tab-inventory").style.display = "none";
            document.querySelector(".button-inventory").style.display = "none";
            
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
                //enderSalesChart(generateDemoLabels(), generateDemoOrders(), generateDemoRevenue());
            }
        }
        

async function fetchInventory() {
    document.getElementById("tab-inventory").style.display = "";
    document.getElementById("card-users").style.display = "none";
    document.getElementById("card-staff").style.display = "none";
    document.getElementById("card-deliveries").style.display = "none";

    document.getElementById("card-inventory").style.display = "";
    document.getElementById("table-count").style.display = "none";

    document.querySelector(".button-inventory").style.display = "";

    try {
        // fetch total food items 
        const res = await fetch("/food");
        const data = await res.json();

        const statInventory = document.getElementById("stat-inventory");
        statInventory.textContent = data.length;

        // display all the food items on the table
        const tbody = document.querySelector("#inventory-table tbody");
        tbody.innerHTML = data.map(s => {
            return `
            <tr data-id="${s.id}">
                <td>
                    <img class="food-image-view" src="/${s.image_path}" onerror="this.style.display='none'"/>
                    <input type="file" class="food-image-input" accept=".png" style="display:none;">
                    <button class="btn-change-image" style="display:none;" onclick="triggerImageUpload(this)">Change Image</button>
                </td>
                <td class="td-name">
                    <input type="text" class="food-input" value="${s.food_name}" disabled>
                </td>
                <td class="td-muted">
                    <input type="text" class="food-input" value="${s.food_price}" disabled>
                </td>
                <td class="td-muted">
                    <input type="text" class="food-input" value="${s.category}" disabled>
                </td>
                <td class="td-muted">${s.is_food_deal == 1 ? "Yes" : "No"}</td>
                <td class="td-item">
                    ${(() => {
                        const items = JSON.parse(s.food_items || "[]");
                        return items.length > 0
                            ? items.map(item => `<div class="food-deal-item">${item}</div>`).join("")
                            : "None";
                    })()}
                </td>
                <td class="td-muted">
                    <input class="food-input" type="text" value="${s.available_stock}" disabled/>
                </td>
                <td>
                    <select class="availability-select ${s.is_available == 1 ? 'availability-no' : 'availability-yes'}" disabled>
                        <option value="1" ${s.is_available == 1 ? "selected" : ""}>Available</option>
                        <option value="0" ${s.is_available == 0 ? "selected" : ""}>Unavailable</option>
                    </select>
                    <button class="btn-edit" onclick="toggleEdit(this)">Edit</button>
                </td>
            </tr>`;
        }).join('');


    } catch (err) {
        console.error(err);
    }
    
}

function openAddInventoryModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('addInventoryModal')) {
        const modal = document.createElement('div');
        modal.id = 'addInventoryModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box" style="max-width: 520px;">
                <div class="modal-head">
                    <div class="modal-title">Add New Food Item</div>
                    <button class="modal-close" onclick="closeAddInventoryModal()">×</button>
                </div>
                <div class="modal-body" style="gap: 14px;">
                    <div class="add-inv-field">
                        <label class="add-inv-label">Food Image</label>
                        <input type="file" id="new-food-image" accept="image/*" class="add-inv-file">
                        <div id="new-food-image-preview" style="margin-top:8px;"></div>
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Food Name</label>
                        <input type="text" id="new-food-name" class="add-inv-input" placeholder="e.g. Salted Egg Chicken Poppers">
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Food Price (₱)</label>
                        <input type="number" id="new-food-price" class="add-inv-input" placeholder="e.g. 259">
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Category</label>
                        <input type="text" id="new-food-category" class="add-inv-input" placeholder="e.g. Appetizers">
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Available Stock</label>
                        <input type="number" id="new-food-stock" class="add-inv-input" placeholder="e.g. 100">
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Is a Food Deal?</label>
                        <select id="new-food-deal" class="add-inv-input" onchange="toggleDealItems()">
                            <option value="0">No</option>
                            <option value="1">Yes</option>
                        </select>
                    </div>
                    <div class="add-inv-field" id="deal-items-field" style="display:none;">
                        <label class="add-inv-label">Food Deal Items <span style="color:var(--text-muted);font-size:10px;">(one per line)</span></label>
                        <textarea id="new-food-deal-items" class="add-inv-input" rows="3" placeholder="e.g.&#10;Burger&#10;Fries&#10;Drink" style="resize:vertical;"></textarea>
                    </div>
                    <div class="add-inv-field">
                        <label class="add-inv-label">Availability</label>
                        <select id="new-food-available" class="add-inv-input">
                            <option value="1">Available</option>
                            <option value="0">Unavailable</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
                        <button class="btn-reset" onclick="closeAddInventoryModal()">Cancel</button>
                        <button class="btn-save-new" onclick="submitNewInventory()">Add Item</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeAddInventoryModal();
        });

        // Image preview
        document.getElementById('new-food-image').addEventListener('change', function() {
            const file = this.files[0];
            const preview = document.getElementById('new-food-image-preview');
            if (file) {
                const url = URL.createObjectURL(file);
                preview.innerHTML = `<img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">`;
            } else {
                preview.innerHTML = '';
            }
        });
    }

    document.getElementById('addInventoryModal').classList.add('open');
}

function closeAddInventoryModal() {
    const modal = document.getElementById('addInventoryModal');
    if (modal) modal.classList.remove('open');
}

function toggleDealItems() {
    const isDeal = document.getElementById('new-food-deal').value === '1';
    document.getElementById('deal-items-field').style.display = isDeal ? '' : 'none';
}

async function submitNewInventory() {
    const name     = document.getElementById('new-food-name').value.trim();
    const price    = document.getElementById('new-food-price').value.trim();
    const category = document.getElementById('new-food-category').value.trim();
    const stock    = document.getElementById('new-food-stock').value.trim();
    const isDeal   = document.getElementById('new-food-deal').value;
    const available = document.getElementById('new-food-available').value;
    const imageFile = document.getElementById('new-food-image').files[0];

    if (!name || !price || !category || !stock) {
        alert('Please fill in all required fields.');
        return;
    }

    // Parse deal items from textarea (one per line)
    let dealItems = [];
    if (isDeal === '1') {
        dealItems = document.getElementById('new-food-deal-items').value
            .split('\n')
            .map(i => i.trim())
            .filter(i => i.length > 0);
    }

    // Use FormData to support image upload
    const formData = new FormData();
    formData.append('food_name', name);
    formData.append('food_price', price);
    formData.append('category', category);
    formData.append('available_stock', stock);
    formData.append('is_food_deal', isDeal);
    formData.append('food_items', JSON.stringify(dealItems));
    formData.append('is_available', available);
    if (imageFile) formData.append('image', imageFile);

    try {
        const btn = document.querySelector('.btn-save-new');
        btn.textContent = 'Saving...';
        btn.disabled = true;

        const res = await fetch('/admin/food/add', {
            method: 'POST',
            body: formData
        });

        const result = await res.json();

        if (res.ok) {
            closeAddInventoryModal();
            fetchInventory(); // Refresh the table
        } else {
            alert(result.error || 'Failed to add item.');
        }
    } catch (err) {
        console.error(err);
        alert('Error connecting to server.');
    } finally {
        const btn = document.querySelector('.btn-save-new');
        if (btn) { btn.textContent = 'Add Item'; btn.disabled = false; }
    }
}

function triggerImageUpload(btn) {
    const row = btn.closest('tr');
    const fileInput = row.querySelector('.food-image-input');
    fileInput.click();
}

function toggleEdit(btn) {
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('input.food-input, select.availability-select');
    const changeImageBtn = row.querySelector('.btn-change-image');
    const fileInput = row.querySelector('.food-image-input');
    const imgEl = row.querySelector('.food-image-view');
    const isEditing = btn.textContent.trim() === "Save";

    if (!isEditing) {
        // --- Enter Edit Mode ---
        inputs.forEach(input => {
            input.disabled = false;
            input.classList.add('not-disabled');
        });
        changeImageBtn.style.display = '';
        btn.textContent = "Save";
        btn.classList.add('btn-save');

        // Preview new image when file is chosen
        fileInput.onchange = function() {
            const file = this.files[0];
            if (!file) return;
            if (file.type !== 'image/png') {
                alert('Only PNG files are allowed.');
                this.value = '';
                return;
            }
            imgEl.style.display = '';
            imgEl.src = URL.createObjectURL(file);
        };

    } else {
        // --- Save Mode: submit to server ---
        const id = row.dataset.id;
        const food_name     = row.querySelectorAll('input.food-input')[0].value.trim();
        const food_price    = row.querySelectorAll('input.food-input')[1].value.trim();
        const category      = row.querySelectorAll('input.food-input')[2].value.trim();
        const available_stock = row.querySelectorAll('input.food-input')[3].value.trim();
        const is_available  = row.querySelector('select.availability-select').value;
        const file          = fileInput.files[0] || null;

        const formData = new FormData();
        formData.append('food_name', food_name);
        formData.append('food_price', food_price);
        formData.append('category', category);
        formData.append('available_stock', available_stock);
        formData.append('is_available', is_available);
        if (file) formData.append('image', file);

        btn.textContent = 'Saving...';
        btn.disabled = true;

        fetch(`/admin/food/update/${id}`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                // Lock everything back
                // alert("huiiii");
                inputs.forEach(input => {
                    input.disabled = true;
                    input.classList.remove('not-disabled');
                });
                changeImageBtn.style.display = 'none';
                fileInput.value = '';
                btn.textContent = 'Edit';
                btn.disabled = false;
                btn.classList.remove('btn-save');
            } else {
                alert(result.error || 'Failed to save changes.');
                btn.textContent = 'Save';
                btn.disabled = false;
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error connecting to server.');
            btn.textContent = 'Save';
            btn.disabled = false;
        });
    }
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