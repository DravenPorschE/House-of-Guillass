document.addEventListener("DOMContentLoaded", () => {
    // check if nakalogin na ba
    const isLoggedIn = localStorage.getItem("isLoggedIn");


    const mobileQuery = window.matchMedia("(max-width: 700px)");

    const viewMobile = document.getElementById("view-mobile");
    const viewPC = document.getElementById("view-pc");

    const menuIcons = document.querySelectorAll("#menu");
    const navLists = document.querySelectorAll("#nav-list");

    // ✅ Toggle menu (burger click)
    menuIcons.forEach((menu, index) => {
        menu.addEventListener("click", () => {
            navLists[index].classList.toggle("show");
        });
    });
    /* -----------------------------
        STATE STORAGE
    ----------------------------- */
    const savedOrder = JSON.parse(localStorage.getItem("lastOrder"));

    const viewOrders = document.querySelectorAll("#view-order");
    const number = document.querySelector(".reservation-number");

    const nameText = document.querySelector(".order-modal-popup .sub-label-name");
    const contactText = document.querySelector(".order-modal-popup .sub-label-contact");
    const addressText = document.querySelector(".order-modal-popup .sub-label-address");

    const orderPopup = document.querySelector(".order-modal-popup");
    const confirmPopup = document.querySelector(".confirmation-popup");

    // Restore UI state
    if (savedOrder) {
        viewOrders.forEach(viewOrder => {
            viewOrder.classList.remove("hidden");
            viewOrder.classList.add("show-view-order");
        });

        if (number) {
            number.textContent = `#${savedOrder.order_number}`;
        }
    }

    /* -----------------------------
        NAVIGATION
    ----------------------------- */

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
    viewOrders.forEach(viewOrder => {
        viewOrder.addEventListener("click", () => {
            const currentOrder = JSON.parse(localStorage.getItem("lastOrder"));

            if (!orderPopup || !currentOrder) return;

            orderPopup.style.display = "flex";

            const orderNumberEl = document.querySelector(".order-reservation-number");
            const nameEl = document.querySelector(".sub-label-name");
            const contactEl = document.querySelector(".sub-label-contact");
            const addressEl = document.querySelector(".sub-label-address");

            // 🔥 MATCHING THE CASE IN YOUR LOCALSTORAGE:
            if (orderNumberEl) {
                // Check for ORDER_NUMBER (caps) or order_number (small) just in case
                orderNumberEl.textContent = `#${currentOrder.ORDER_NUMBER || currentOrder.order_number}`;
            }

            if (nameEl) {
                const name = currentOrder.delivery_name || "Not set";
                nameEl.textContent = `Delivery To: ${name}`;
            }

            if (contactEl) {
                const contact = currentOrder.delivery_contact || "Not set";
                contactEl.textContent = `Contact Number: ${contact}`;
            }

            if (addressEl) {
                // Check for DELIVERY_ADDRESS (caps) or delivery_address (small)
                const address = currentOrder.DELIVERY_ADDRESS || currentOrder.delivery_address || "Not set";
                addressEl.textContent = `Delivery Address: ${address}`;
            }
        });
    });

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

        if(!isLoggedIn) {
            alert("You need to login first!");
            window.location.href = "../pages/account-creation.html";
            return 
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
    const confirmBtn = document.querySelector(".btn-confirm");

    let isSubmitting = false;

    confirmBtn?.addEventListener("click", async () => {
        if (isSubmitting) return; 
        isSubmitting = true;

        // Grab the ID from localStorage
        const userId = localStorage.getItem("user_id");
        
        // Safety check: if no user is logged in, the database will reject it anyway
        if (!userId) {
            alert("You must be logged in to place an order!");
            isSubmitting = false;
            return;
        }

        const deliveryNameInput = document.querySelector(".delivery-name");
        const deliveryContactInput = document.querySelector(".delivery-contact");
        const addressInput = document.querySelector(".delivery-address");

        const deliveryName = deliveryNameInput?.value.trim() || "Guest";
        const deliveryContact = deliveryContactInput?.value.trim() || "No Contact";
        const address = addressInput?.value.trim();

        if (!address) {
            alert("Please enter delivery address!");
            isSubmitting = false;
            return;
        }

        if (!pendingOrder) {
            isSubmitting = false;
            return;
        }

        // 🔥 UPDATED PAYLOAD: Included user_id
        const payload = {
            user_id: userId, // The key to everything
            order_number: pendingOrder.order_number,
            cart_list: pendingOrder.cart_list,
            total_price: pendingOrder.total_price,
            delivery_address: address // The only "new" info needed
        };

        try {
            const res = await fetch("/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Failed to place order");
            }

            // SAVE FIRST
            // Inside your try block, after the fetch succeeds:
            // Inside your confirmBtn try block...
            const saved = {
                order_number: pendingOrder.order_number,
                // Change these to match what your UI code looks for below
                delivery_name: document.querySelector(".delivery-name")?.value || "User",
                delivery_contact: document.querySelector(".delivery-contact")?.value || "N/A",
                delivery_address: address
            };

            // Now this will work because the names match!
            localStorage.setItem("lastOrder", JSON.stringify(saved));

            // Update the popup labels so the user sees their info
            document.querySelectorAll(".sub-label-name").forEach(el => el.textContent = `Deliver To: ${saved.display_name}`);
            document.querySelectorAll(".sub-label-contact").forEach(el => el.textContent = `Contact: ${saved.display_contact}`);

            // SHOW ORDER POPUP
            if (orderPopup) orderPopup.style.display = "flex";

            const orderNumberEl = document.querySelector(".order-reservation-number");
            if (orderNumberEl) {
                orderNumberEl.textContent = `#${pendingOrder.order_number}`;
            }

            // update UI labels
            // Remove those "Update the popup labels" lines and just use these:
            document.querySelectorAll(".sub-label-name").forEach(el => {
                el.textContent = `Deliver To: ${saved.delivery_name}`;
            });
            document.querySelectorAll(".sub-label-contact").forEach(el => {
                el.textContent = `Contact Number: ${saved.delivery_contact}`;
            });
            document.querySelectorAll(".sub-label-address").forEach(el => {
                el.textContent = `Delivery Address: ${saved.delivery_address}`;
            });
            // Reset state
            confirmPopup.style.display = "none";
            cart = [];
            total = 0;
            pendingOrder = null;
            updateUI();

        } catch (err) {
            console.error(err);
            alert(err.message);
        }

        isSubmitting = false;
    });

    // Function to auto-fill user details from account
    async function autoFillUserDetails() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            const res = await fetch(`/fetch-account/${userId}`);
            const user = await res.json();

            if (res.ok) {
                const nameInput = document.querySelector(".delivery-name");
                const contactInput = document.querySelector(".delivery-contact");
                
                // Fill the inputs automatically
                if (nameInput) nameInput.value = user.full_name;
                if (contactInput) contactInput.value = user.phone_number;
            }
        } catch (err) {
            console.error("Could not fetch user details", err);
        }
    }

    // Call it immediately
    autoFillUserDetails();
    

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

    async function syncActiveOrder() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            const res = await fetch(`/latest-active-order/${userId}`);
            const activeOrder = await res.json();

            if (activeOrder) {
                const normalizedOrder = {
                    order_number: activeOrder.ORDER_NUMBER || activeOrder.order_number,
                    delivery_address: activeOrder.DELIVERY_ADDRESS || activeOrder.delivery_address,
                    delivery_name: activeOrder.delivery_name,
                    delivery_contact: activeOrder.delivery_contact,
                    status: activeOrder.status
                };
                localStorage.setItem("lastOrder", JSON.stringify(normalizedOrder));
            } else {
                // If the order was finished or deleted, clean up
                localStorage.removeItem("lastOrder");
            }
        } catch (err) {
            console.error("Error syncing order status:", err);
        }
    }

    

    document.querySelector(".close-popup-confirmation")?.addEventListener("click", () => {
        confirmPopup.style.display = "none";
    });

    /* -----------------------------
        INIT
    ----------------------------- */
    if (menuContainer) loadMenu();

    // Execute this at the end of your DOMContentLoaded
    syncActiveOrder();
});