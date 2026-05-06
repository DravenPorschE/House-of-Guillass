document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------
        STATE STORAGE
    ----------------------------- */
    const savedOrder = JSON.parse(localStorage.getItem("lastOrder"));

    const viewOrder = document.getElementById("view-order");
    const number = document.querySelector(".reservation-number");

    const nameText = document.querySelector(".order-modal-popup .sub-label-name");
    const contactText = document.querySelector(".order-modal-popup .sub-label-contact");
    const addressText = document.querySelector(".order-modal-popup .sub-label-address");

    const orderPopup = document.querySelector(".order-modal-popup");
    const confirmPopup = document.querySelector(".confirmation-popup");

    // Restore UI state
    if (savedOrder) {
        if (viewOrder) {
            viewOrder.classList.remove("hidden");
            viewOrder.classList.add("show-view-order");
        }

        if (number) {
            number.textContent = `#${savedOrder.order_number}`;
        }
    }

    /* -----------------------------
        NAVIGATION
    ----------------------------- */
    const menuBtn = document.getElementById("menu");
    const navList = document.getElementById("nav-list");

    menuBtn?.addEventListener("click", () => {
        navList?.classList.toggle("show");
    });

    document.getElementById("homepage")?.addEventListener("click", () => {
        window.location.href = "/index.html";
    });

    document.getElementById("order")?.addEventListener("click", () => {
        window.location.href = "/index.html#order";
    });

    document.getElementById("reserve")?.addEventListener("click", () => {
        window.location.href = "/pages/table_reserve_form.html";
    });

    /* -----------------------------
    TABLE RESERVATION FORM
    ----------------------------- */
    const reservationForm = document.getElementById("reservation-form");

    reservationForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const reservationId = Math.floor(1000 + Math.random() * 9000); // generate ID client-side

        const payload = {
            reservation_id:   reservationId,
            full_name:        document.getElementById("res-name").value.trim(),
            contact_number:   document.getElementById("res-contact").value.trim(),
            reservation_date: document.getElementById("res-date").value,
            reservation_time: document.getElementById("res-time").value,
            guests:           document.getElementById("res-guests").value
        };

        fetch("/reservation", {  // ✅ matches your backend route
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return alert("Error: " + data.error);
            }

            // Show success modal
            const modal = document.querySelector(".modal-popup");
            const reservationNumber = document.querySelector(".reservation-number");

            if (reservationNumber) {
                reservationNumber.textContent = `#${data.reservation_id}`;
            }

            if (modal) modal.style.display = "flex";
        })
        .catch(err => {
            console.error(err);
            alert("Failed to submit reservation. Please try again.");
        });
    });

    /* -----------------------------
        VIEW ORDER POPUP (FIXED)
    ----------------------------- */
    if (viewOrder) {
        viewOrder.addEventListener("click", () => {

            if (!orderPopup || !savedOrder) return;

            orderPopup.style.display = "flex";

            const orderNumberEl = document.querySelector(".order-reservation-number");
            const nameEl = document.querySelector(".sub-label-name");
            const contactEl = document.querySelector(".sub-label-contact");
            const addressEl = document.querySelector(".sub-label-address");

            if (orderNumberEl) {
                orderNumberEl.textContent = `#${savedOrder.order_number}`;
            }

            if (nameEl) {
                nameEl.textContent = savedOrder.delivery_name
                    ? `Delivery To: ${savedOrder.delivery_name}`
                    : `Delivery To: Not set`;
            }

            if (contactEl) {
                contactEl.textContent = savedOrder.delivery_contact
                    ? `Contact Number: ${savedOrder.delivery_contact}`
                    : `Contact Number: Not set`;
            }

            if (addressEl) {
                addressEl.textContent = savedOrder.delivery_address
                    ? `Delivery Address: ${savedOrder.delivery_address}`
                    : `Delivery Address: Not set`;
            }
        });
    }

    /* -----------------------------
        MENU SYSTEM
    ----------------------------- */
    const menuContainer = document.getElementById("menu-container");

    let cart = [];
    let total = 0;
    let pendingOrder = null;

    function loadMenu() {
        fetch("/food")
            .then(res => res.json())
            .then(renderMenu)
            .catch(console.error);
    }

    window.filterMenu = function (category, event) {
        const items = document.querySelectorAll(".menu-item");
        const buttons = document.querySelectorAll(".tab-btn");

        buttons.forEach(btn => btn.classList.remove("active"));
        event?.currentTarget?.classList.add("active");

        items.forEach(item => {
            const match =
                category === "all" ||
                item.classList.contains("category-" + category);

            item.style.display = match ? "flex" : "none";
        });
    };

    function renderMenu(items) {
        if (!menuContainer) return;

        menuContainer.innerHTML = "";

        items.forEach(item => {
            const div = document.createElement("div");

            div.classList.add("menu-item");
            div.classList.add(`category-${item.category.toLowerCase()}`);

            let dealHTML = "";

            if (item.is_food_deal == 1 && item.food_items) {
                const itemsList = JSON.parse(item.food_items);

                dealHTML = `
                    <p class="deal-items">
                        ${itemsList.join(", ")}
                    </p>
                `;
            }

            div.innerHTML = `
                <img class="menu-img"
                    src="assets/images/${item.food_name.toLowerCase().replace(/\s+/g, "-")}.png">

                <div class="item-info">
                    <h4>${item.food_name}</h4>
                    ${dealHTML}
                    <span class="price">₱${parseFloat(item.food_price).toFixed(2)}</span>
                </div>

                <button class="btn-add">
                    <span class="btn-label">Add</span>
                    <span class="added-flash">✓ Added!</span>
                </button>
            `;

            div.querySelector("button").addEventListener("click", (e) => {
                // ripple
                createRipple(e, e.currentTarget);

                // added flash
                const btn = e.currentTarget;
                btn.classList.add("added");
                setTimeout(() => btn.classList.remove("added"), 1200);

                // your existing cart logic
                cart.push({
                    name: item.food_name,
                    price: parseFloat(item.food_price)
                });

                total += parseFloat(item.food_price);
                updateUI();
            });

            menuContainer.appendChild(div);
        });
    }

    function createRipple(e, btn) {
        const circle = document.createElement("span");
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
        circle.className = "ripple";
        circle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
        btn.appendChild(circle);
        circle.addEventListener("animationend", () => circle.remove());
    }

    function updateUI() {
        const list = document.getElementById("cart-list");
        const totalEl = document.getElementById("total-price");

        if (!list || !totalEl) return;

        list.innerHTML = "";

        cart.forEach((item, index) => {
            const li = document.createElement("li");

            li.innerHTML = `
                <span>${item.name}</span>
                <span>₱${item.price.toFixed(2)}</span>
                <button class="remove-item" data-index="${index}">✕</button>
            `;

            list.appendChild(li);
        });

        totalEl.textContent = `₱${total.toFixed(2)}`;

        attachRemoveEvents(); // 🔥 important
    }

    function attachRemoveEvents() {
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = e.target.getAttribute("data-index");

                const removedItem = cart[index];

                // subtract price
                total -= removedItem.price;

                // remove from cart
                cart.splice(index, 1);

                updateUI();
            });
        });
    }

    function generateOrderId() {
        return Math.floor(1000 + Math.random() * 9000);
    }

    /* -----------------------------
        CHECKOUT (STEP 1: ADDRESS)
    ----------------------------- */
    window.checkout = function () {
        if (cart.length === 0) {
            return alert("Your cart is empty!");
        }

        const orderId = generateOrderId();

        pendingOrder = {
            order_number: orderId,
            cart_list: JSON.stringify(cart),
            total_price: total
        };

        confirmPopup.style.display = "flex";
    };

    /* -----------------------------
        CONFIRM ADDRESS + SUBMIT
    ----------------------------- */
    document.querySelector(".btn-confirm")?.addEventListener("click", () => {

        const deliveryNameInput = document.querySelector(".delivery-name");
        const deliveryContactInput = document.querySelector(".delivery-contact");
        const addressInput = document.querySelector(".delivery-address");

        const deliveryName = deliveryNameInput?.value.trim();
        const deliveryContact = deliveryContactInput?.value.trim();
        const address = addressInput?.value.trim();

        if (!address) {
            return alert("Please enter delivery address!");
        }

        if (!pendingOrder) return;

        const payload = {
            order_number: pendingOrder.order_number,
            cart_list: pendingOrder.cart_list,
            total_price: pendingOrder.total_price,
            delivery_name: deliveryName || "Not Set",
            delivery_contact: deliveryContact || "Not Set",
            delivery_address: address || "Not set"
        };

        fetch("/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(() => {

            if (orderPopup) orderPopup.style.display = "flex";

            const orderNumberEl = document.querySelector(".order-reservation-number");

            if (orderNumberEl) {
                orderNumberEl.textContent = `#${pendingOrder.order_number}`;
            }

            if(nameText) {
                nameText.textContent = `Deliver To: ${deliveryName}`
            }

            if(contactText) {
                contactText.textContent = `Contact Nunber: ${deliveryContact}`;
            }

            if (addressText) {
                addressText.textContent = `Delivery Address: ${address}`;
            }

            if (viewOrder) {
                viewOrder.classList.remove("hidden");
                viewOrder.classList.add("show-view-order");
            }

            // SAVE ORDER
            localStorage.setItem("lastOrder", JSON.stringify({
                order_number: pendingOrder.order_number,
                delivery_name: deliveryName,
                delivery_contact: deliveryContact,
                delivery_address: address
            }));

            confirmPopup.style.display = "none";

            cart = [];
            total = 0;
            pendingOrder = null;
            updateUI();
        })
        .catch(err => {
            console.error(err);
            alert("Failed to place order.");
        });
    });

    /* -----------------------------
        CLOSE BUTTONS (FIXED)
    ----------------------------- */
    document.querySelectorAll(".close-popup").forEach(btn => {
        btn.addEventListener("click", () => {

            const modal = document.querySelector(".modal-popup");
            if (modal) modal.style.display = "none";

            if (orderPopup) orderPopup.style.display = "none";

            location.reload();
        });
    });

    document.querySelector(".close-popup-confirmation")?.addEventListener("click", () => {
        confirmPopup.style.display = "none";
    });

    /* -----------------------------
        INIT
    ----------------------------- */
    if (menuContainer) loadMenu();
});