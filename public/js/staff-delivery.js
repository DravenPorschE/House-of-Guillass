document.addEventListener("DOMContentLoaded", () => {

    const orderList = document.querySelector(".order-scroll");
    const refreshBtn = document.querySelector(".refresh-btn");
    const orderView = document.querySelector(".order-view");

    function formatTime(createdAt) {
        if (!createdAt) return "Unknown time";

        const date = new Date(createdAt);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin} min ago`;

        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr ago`;

        return date.toLocaleString();
    }

    function getStatusBadge(status) {
        switch ((status || "pending").toLowerCase()) {
            case "pending":    return "badge-new";
            case "preparing":  return "badge-pending";
            case "delivering": return "badge-ready";
            case "delivered":  return "badge-done";
            default:           return "badge-new";
        }
    }

    function updateOrderStatus(orderId, status) {
        fetch(`/food-orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        })
        .then(res => res.json())
        .then(() => {
            getOrderList();
        })
        .catch(err => {
            console.error("Failed to update status:", err);
        });
    }

    function getNextStatus(status) {
        switch ((status || "pending").toLowerCase()) {
            case "pending":    return { label: "Start Preparing", next: "preparing" };
            case "preparing":  return { label: "Mark Delivering", next: "delivering" };
            case "delivering": return { label: "Mark Delivered",  next: "delivered" };
            default:           return null;
        }
    }

    function renderOrderView(order) {
        if (!orderView) return;

        const orderId     = order.id || order.ID;
        const orderNumber = order.order_number || order.ORDER_NUMBER;
        const status      = (order.status || order.STATUS || "pending").toLowerCase();
        const createdAt   = order.created_at || order.CREATED_AT;
        const items       = order.cart_list || [];
        const total       = order.total_price
            || items.reduce((sum, i) => sum + parseFloat(i.price || 0), 0);

        const nextStatus = getNextStatus(status);

        orderView.innerHTML = `
            <div class="view-header">
                <div>
                    <button class="back-btn" id="backBtn">Orders</button>
                    <div class="view-order-id">Order #${orderNumber}</div>
                    <div class="view-meta">
                        ${formatTime(createdAt)}
                        &nbsp;·&nbsp;
                        <span class="order-badge ${getStatusBadge(status)}">${status}</span>
                    </div>
                </div>
                <div class="view-actions">
                    ${nextStatus ? `
                        <button class="action-btn primary-action" id="statusBtn">
                            ${nextStatus.label}
                        </button>
                    ` : `
                        <button class="action-btn" disabled style="opacity:0.4; cursor:default;">
                            Completed
                        </button>
                    `}
                </div>
            </div>
            <div class="view-body">
                <div class="section-label">Customer Details</div>
                <div class="item-row">
                    <span class="item-name">👤 ${order.delivery_name || "Not set"}</span>
                </div>
                <div class="item-row">
                    <span class="item-name">📞 ${order.delivery_contact || "Not set"}</span>
                </div>
                <div class="section-label" style="margin-top: 8px;">Delivery Address</div>
                <div class="item-row">
                    <span class="item-name">📍 ${order.delivery_address || "Not set"}</span>
                </div>
                <div class="section-label" style="margin-top: 8px;">Items</div>
                ${items.map(i => `
                    <div class="item-row">
                        <span class="item-name">${i.name}</span>
                        <span class="item-qty">×${i.qty || 1}</span>
                        <span class="item-price">₱${parseFloat(i.price).toLocaleString()}</span>
                    </div>
                `).join("")}
                <div class="divider"></div>
                <div class="total-row">
                    <span class="total-label">Total</span>
                    <span class="total-value">₱${parseFloat(total).toLocaleString()}</span>
                </div>
            </div>
        `;
        // open panel on mobile
        orderView.classList.add("open");

        // back button
        document.getElementById("backBtn")?.addEventListener("click", () => {
            orderView.classList.remove("open");
            document.querySelectorAll(".order-item").forEach(i => i.classList.remove("active"));
        });

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
                    const orderId     = order.id || order.ID;
                    const orderNumber = order.order_number || order.ORDER_NUMBER;
                    const status      = (order.status || order.STATUS || "pending").toLowerCase();
                    const createdAt   = order.created_at || order.CREATED_AT;
                    
                    const li = document.createElement("li");
                    li.classList.add("order-item");
                    li.dataset.id = orderId;

                    li.innerHTML = `
                        <div>
                            <div class="order-num">Order #${orderNumber}</div>
                            <div class="order-time">${formatTime(createdAt)}</div>
                        </div>
                        <span class="order-badge ${getStatusBadge(status)}">${status}</span>
                    `;

                    li.addEventListener("click", () => {
                        document.querySelectorAll(".order-item").forEach(i => i.classList.remove("active"));
                        li.classList.add("active");
                        renderOrderView(order);
                    });

                    // re-select previously active order after refresh
                    if (String(orderId) === String(activeId)) {
                        li.classList.add("active");
                        renderOrderView(order);
                    }

                    orderList.appendChild(li);
                });
            })
            .catch(err => {
                console.error("Error loading orders:", err);
            });
    }

    getOrderList();

    refreshBtn?.addEventListener("click", getOrderList);

    setInterval(getOrderList, 5000);
});