// Move apSwitch outside or attach to window so HTML onclick can find it
window.apSwitch = function(panel, tab) {
    document.querySelectorAll('.ap-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ap-panel').forEach(p => p.style.display = 'none');
    tab.classList.add('active');
    document.getElementById('ap-' + panel).style.display = 'block';
};

document.addEventListener("DOMContentLoaded", () => {
    const orderList = document.querySelector(".order-scroll");
    const refreshBtn = document.querySelector(".refresh-btn");
    const orderView = document.querySelector(".order-view");

    const accountLogout = document.querySelectorAll("#account-logout");
    
    // 🔥 FIX 1: Define the popup container
    const popupContainer = document.querySelector(".account-popup-container");
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");

    // Check if already logged in
    if (localStorage.getItem("staff_id")) {
        if (popupContainer) popupContainer.style.display = "none";
    }

    /* -----------------------------
        UTILITIES
    ----------------------------- */
    function formatTime(createdAt) {
        if (!createdAt) return "Unknown time";
        const date = new Date(createdAt);
        const now = new Date();
        const diffMin = Math.floor((now - date) / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        return diffHr < 24 ? `${diffHr} hr ago` : date.toLocaleString();
    }

    function getStatusBadge(status) {
        const s = (status || "pending").toLowerCase();
        const badges = {
            pending: "badge-new",
            preparing: "badge-pending",
            delivering: "badge-ready",
            delivered: "badge-done"
        };
        return badges[s] || "badge-new";
    }

    /* -----------------------------
        ORDER ACTIONS
    ----------------------------- */
    function updateOrderStatus(orderId, status) {
        const staffId = localStorage.getItem("staff_id"); 

        // Log this to your browser console (F12) to verify the ID exists
        console.log(`Request: Updating Order #${orderId} to "${status}" by Staff ID: ${staffId}`);

        if (!staffId) {
            console.error("No staff_id found in localStorage. Update aborted.");
            alert("Session expired. Please log in again.");
            return;
        }

        fetch(`/food-orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                status: status, 
                staff_id: staffId 
            })
        })
        .then(res => res.json())
        .then((data) => {
            console.log("Server Response:", data);
            getOrderList(); // Refresh the UI
        })
        .catch(err => console.error("Failed to update status:", err));
    }

    function getNextStatus(status) {
        const s = (status || "pending").toLowerCase();
        if (s === "pending") return { label: "Start Preparing", next: "preparing" };
        if (s === "preparing") return { label: "Mark Delivering", next: "delivering" };
        if (s === "delivering") return { label: "Mark Delivered", next: "delivered" };
        return null;
    }

    /* -----------------------------
        RENDERING
    ----------------------------- */
    function renderOrderView(order) {
        if (!orderView) return;

        const orderId = order.id || order.ID;
        const orderNumber = order.order_number || order.ORDER_NUMBER;
        const status = (order.status || order.STATUS || "pending").toLowerCase();

        const deliveryName = order.full_name || order.FULL_NAME || "Not set";
        const deliveryContact = order.phone_number || order.PHONE_NUMBER || "Not set";
        const deliveryAddress = order.delivery_address || order.DELIVERY_ADDRESS || "Not set";

        // Item parsing logic (Double Parse Fix)
        let items = [];
        try {
            let rawData = order.cart_list || order.CART_LIST;
            if (typeof rawData === 'string') {
                let firstPass = JSON.parse(rawData);
                items = (typeof firstPass === 'string') ? JSON.parse(firstPass) : firstPass;
            } else {
                items = rawData || [];
            }
        } catch (e) { items = []; }

        const nextStatus = getNextStatus(status);

        orderView.innerHTML = `
            <div class="view-header">
                <div>
                    <button class="back-btn" id="backBtn">Orders</button>
                    <div class="view-order-id">Order #${orderNumber}</div>
                    <div class="view-meta">
                        ${formatTime(order.created_at || order.CREATED_AT)}
                        &nbsp;·&nbsp;
                        <span class="order-badge ${getStatusBadge(status)}">${status}</span>
                    </div>
                </div>
                <div class="view-actions">
                    ${nextStatus ? `
                        <button class="action-btn primary-action" id="statusBtn">${nextStatus.label}</button>
                    ` : `
                        <button class="action-btn" disabled style="opacity:0.4;">Completed</button>
                    `}
                </div>
            </div>
            <div class="view-body">
                <div class="section-label">Customer Details</div>
                <div class="item-row">👤 ${deliveryName}</div>
                <div class="item-row">📞 ${deliveryContact}</div>
                <div class="section-label">Address</div>
                <div class="item-row">📍 ${deliveryAddress}</div>
                
                <div class="section-label">Items</div>
                ${items.map(i => `
                    <div class="item-row">
                        <span>${i.name} ×${i.qty || 1}</span>
                        <span>₱${parseFloat(i.price).toLocaleString()}</span>
                    </div>
                `).join("")}
            </div>
        `;
        
        orderView.classList.add("open");
        document.getElementById("backBtn")?.addEventListener("click", () => orderView.classList.remove("open"));

        if (nextStatus) {
            document.getElementById("statusBtn").addEventListener("click", () => {
                updateOrderStatus(orderId, nextStatus.next);
            });
        }
    }

    function getOrderList() {
        fetch("/food-orders")
            .then(res => res.json())
            .then(data => {
                if (!orderList) return;
                const activeId = document.querySelector(".order-item.active")?.dataset.id;
                orderList.innerHTML = "";
                data.forEach(order => {
                    const id = order.id || order.ID;
                    const li = document.createElement("li");
                    li.className = `order-item ${String(id) === String(activeId) ? 'active' : ''}`;
                    li.dataset.id = id;
                    li.innerHTML = `
                        <div>
                            <div class="order-num">Order #${order.order_number || order.ORDER_NUMBER}</div>
                            <div class="order-time">${formatTime(order.created_at || order.CREATED_AT)}</div>
                        </div>
                        <span class="order-badge ${getStatusBadge(order.status)}">${order.status}</span>
                    `;
                    li.addEventListener("click", () => {
                        document.querySelectorAll(".order-item").forEach(i => i.classList.remove("active"));
                        li.classList.add("active");
                        renderOrderView(order);
                    });
                    orderList.appendChild(li);
                });
            });
    }

    /* -----------------------------
        AUTH HANDLERS
    ----------------------------- */
    loginBtn?.addEventListener("click", () => {
        const email = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        fetch('/staff-login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                localStorage.setItem("staff_id", result.staff_id);
                popupContainer.style.display = "none";
                getOrderList();
            } else {
                alert(result.error);
            }
        });
    });

    signupBtn?.addEventListener("click", () => {
        const data = {
            username: document.getElementById("username-input").value,
            full_name: document.getElementById("fullname-input").value,
            email: document.getElementById("email-input").value,
            phone_number: document.getElementById("phone-number-input").value,
            password: document.getElementById("password-input").value // Matches your HTML typo
        };

        fetch('/staff-signup', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert("Account created! Please Sign In.");
                window.apSwitch('login', document.querySelectorAll('.ap-tab')[0]);
            } else {
                alert(result.error);
            }
        });
    });

    
    const mobileQuery = window.matchMedia("(max-width: 700px)");

    const viewMobile = document.getElementById("view-mobile");
    const viewPC = document.getElementById("view-pc");

    const menuIcons = document.querySelectorAll("#menu");
    const navLists = document.querySelectorAll("#nav-list");

    function handleViewChange(e) {
        if (e.matches) {
            // MOBILE
            viewMobile.style.display = "block";
            viewPC.style.display = "none";
        } else {
            // DESKTOP
            viewMobile.style.display = "none";
            viewPC.style.display = "block";

            // reset mobile menu if open
            navLists.forEach(list => list.classList.remove("show"));
        }
    }

    // run on load
    handleViewChange(mobileQuery);

    // run on resize
    mobileQuery.addEventListener("change", handleViewChange);

    // ✅ Toggle menu (burger click)
    menuIcons.forEach((menu, index) => {
        menu.addEventListener("click", () => {
            navLists[index].classList.toggle("show");
        });
    });

    // If using querySelectorAll, you must use a loop:
    document.querySelectorAll("#account-logout").forEach(button => {
        button.addEventListener("click", () => {
            if(confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = "/staff-delivery";
            }
        });
    });

    getOrderList();
    setInterval(getOrderList, 5000);
});