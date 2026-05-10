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
        const savedReservation = JSON.parse(
        localStorage.getItem("lastReservation")
    );

    const viewOrders = document.querySelectorAll("#view-order");
    const viewReservations = document.querySelectorAll("#view-reservation");

    const number = document.querySelector(".reservation-number");

    const nameText = document.querySelector(".order-modal-popup .sub-label-name");
    const contactText = document.querySelector(".order-modal-popup .sub-label-contact");
    const addressText = document.querySelector(".order-modal-popup .sub-label-address");

    const orderPopup = document.querySelector(".order-modal-popup");
    const confirmPopup = document.querySelector(".confirmation-popup");

    const deliveryContactInput = document.querySelector(".delivery-contact");

    deliveryContactInput?.addEventListener("input", () => {

        // numbers only
        deliveryContactInput.value =
            deliveryContactInput.value.replace(/\D/g, "");

        // max 11 digits
        deliveryContactInput.value =
            deliveryContactInput.value.slice(0, 11);

    });

    // Restore UI state
    // Restore order UI
    if (savedOrder) {

        viewOrders.forEach(viewOrder => {
            viewOrder.classList.remove("hidden");
            viewOrder.classList.add("show-view-order");
        });

        if (number) {
            number.textContent = `#${savedOrder.order_number}`;
        }
    }

    // Restore reservation UI
    if (savedReservation) {

        viewReservations.forEach(btn => {
            btn.classList.remove("hidden");
            btn.classList.add("show-view-order");
        });
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

        const reservationId = Math.floor(1000 + Math.random() * 9000);

        const userId = localStorage.getItem("user_id");

        if (!userId) {
            alert("You need to login first!");
            window.location.href = "../pages/account-creation.html";
            return;
        }

        // INPUTS
        const fullNameInput = document.getElementById("res-name");
        const contactInput = document.getElementById("res-contact");
        const dateInput = document.getElementById("res-date");
        const timeInput = document.getElementById("res-time");
        const guestsInput = document.getElementById("res-guests");

        // VALUES
        const fullName = fullNameInput.value.trim();
        const contactNumber = contactInput.value.trim();
        const reservationDate = dateInput.value;
        const reservationTime = timeInput.value;
        const guests = guestsInput.value;

        // ✅ REQUIRED VALIDATIONS
        if (!fullName) {
            alert("Please enter your full name!");
            fullNameInput.focus();
            return;
        }

        if (!contactNumber) {
            alert("Please enter your contact number!");
            contactInput.focus();
            return;
        }

        // ✅ Philippine number validation
        const phoneRegex = /^09\d{9}$/;

        if (!phoneRegex.test(contactNumber)) {
            alert("Please enter a valid Philippine phone number (09XXXXXXXXX)");
            contactInput.focus();
            return;
        }

        if (!reservationDate) {
            alert("Please select a reservation date!");
            dateInput.focus();
            return;
        }

        if (!reservationTime) {
            alert("Please select a reservation time!");
            timeInput.focus();
            return;
        }

        if (!guests || guests < 1) {
            alert("Please enter number of guests!");
            guestsInput.focus();
            return;
        }

        // PAYLOAD
        const payload = {
            user_id: userId,
            reservation_id: reservationId,
            full_name: fullName,
            contact_number: contactNumber,
            reservation_date: reservationDate,
            reservation_time: reservationTime,
            guests: guests
        };

        fetch("/reservation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

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

            // SAVE RESERVATION
            const savedReservation = {
                reservation_id: data.reservation_id,
                full_name: payload.full_name,
                contact_number: payload.contact_number,
                reservation_date: payload.reservation_date,
                reservation_time: payload.reservation_time,
                guests: payload.guests
            };

            localStorage.setItem(
                "lastReservation",
                JSON.stringify(savedReservation)
            );

            // Show View Reservation button
            const viewReservations = document.querySelectorAll("#view-reservation");

            viewReservations.forEach(btn => {
                btn.classList.remove("hidden");
                btn.classList.add("show-view-order");
            });

            // Show success modal
            const modal = document.querySelector(".modal-popup");
            const reservationNumber = document.querySelector(".reservation-number");

            if (reservationNumber) {
                reservationNumber.textContent = `#${data.reservation_id}`;
            }

            // OPTIONAL DETAILS
            const modalDetails = document.querySelector(".reservation-details");

            if (modalDetails) {
                modalDetails.innerHTML = `
                    <p>Name: ${payload.full_name}</p>
                    <p>Contact: ${payload.contact_number}</p>
                    <p>Date: ${payload.reservation_date}</p>
                    <p>Time: ${payload.reservation_time}</p>
                    <p>Guests: ${payload.guests}</p>
                `;
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
    VIEW RESERVATION
    ----------------------------- */
    const reservationPopup = document.querySelector(".view-reservation-popup");

    viewReservations.forEach(btn => {
        btn.addEventListener("click", async () => {

            const userId = localStorage.getItem("user_id");

            if (!userId) return;

            try {

                // FETCH LATEST RESERVATION
                const res = await fetch(`/latest-reservation/${userId}`);

                const reservation = await res.json();

                if (!reservation) {
                    alert("No reservation found!");
                    return;
                }

                reservationPopup.style.display = "flex";

                document.querySelector(".view-reservation-number").textContent =
                    `#${reservation.RESERVATION_ID || reservation.reservation_id}`;

                document.querySelector(".reservation-name").textContent =
                    `Name: ${reservation.full_name}`;

                document.querySelector(".reservation-contact").textContent =
                    `Contact: ${reservation.CONTACT_NUMBER}`;

                document.querySelector(".reservation-date").textContent =
                    `Date: ${reservation.reservation_date}`;

                document.querySelector(".reservation-time").textContent =
                    `Time: ${reservation.RESERVATION_TIME}`;

                document.querySelector(".reservation-guests").textContent =
                    `Guests: ${reservation.guests}`;

                document.querySelector("rp-done-btn")?.addEventListener("click", () => {
                    reservationPopup.style.display = "none";
                });

            } catch (err) {
                console.error(err);
                alert("Failed to fetch reservation");
            }
        });
    });

    document.querySelectorAll(".close-reservation-popup").forEach(btn => {

        btn.addEventListener("click", () => {

            const popup = document.querySelector(".view-reservation-popup");

            if (popup) {
                popup.style.display = "none";
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
            // ── AVAILABILITY CHECK ──
            if (item.is_available == 0) return;       // hidden if marked unavailable
            if (item.available_stock <= 0) return;    // hidden if out of stock

            const div = document.createElement("div");
            div.classList.add("menu-item");
            div.classList.add(`category-${item.category.toLowerCase()}`);

            let dealHTML = "";
            if (item.is_food_deal == 1 && item.food_items) {
                const itemsList = JSON.parse(item.food_items);
                dealHTML = `<p class="deal-items">${itemsList.join(", ")}</p>`;
            }

            // Show low stock warning badge if stock is low but > 0
            const lowStockBadge = item.available_stock < 10
                ? `<span class="low-stock-badge">Only ${item.available_stock} left!</span>`
                : '';

            div.innerHTML = `
                <img class="menu-img" src="../${item.image_path}">
                <div class="item-info">
                    <h4>${item.food_name}</h4>
                    ${dealHTML}
                    ${lowStockBadge}
                    <span class="price">₱${parseFloat(item.food_price).toFixed(2)}</span>
                </div>
                <button class="btn-add">
                    <span class="btn-label">Add</span>
                    <span class="added-flash">✓ Added!</span>
                </button>
            `;

            div.querySelector("button").addEventListener("click", (e) => {
                // ── STOCK CHECK ON ADD ──
                const itemInCart = cart.filter(c => c.name === item.food_name).length;
                if (itemInCart >= item.available_stock) {
                    alert(`Sorry, only ${item.available_stock} of "${item.food_name}" available.`);
                    return;
                }

                createRipple(e, e.currentTarget);

                const btn = e.currentTarget;
                btn.classList.add("added");
                setTimeout(() => btn.classList.remove("added"), 1200);

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

        // Inputs
        const deliveryNameInput = document.querySelector(".delivery-name");
        const deliveryContactInput = document.querySelector(".delivery-contact");
        const addressInput = document.querySelector(".delivery-address");

        const deliveryName = deliveryNameInput?.value.trim();
        const deliveryContact = deliveryContactInput?.value.trim();
        const address = addressInput?.value.trim();

        // ✅ Required validations
        if (!deliveryName) {
            alert("Please enter your full name!");
            deliveryNameInput?.focus();
            return;
        }

        if (!deliveryContact) {
            alert("Please enter your contact number!");
            deliveryContactInput?.focus();
            return;
        }

        // ✅ Philippine phone validation
        const phoneRegex = /^09\d{9}$/;

        if (!phoneRegex.test(deliveryContact)) {
            alert("Please enter a valid Philippine phone number (09XXXXXXXXX)");
            deliveryContactInput?.focus();
            return;
        }

        if (!address) {
            alert("Please enter your delivery address!");
            addressInput?.focus();
            return;
        }

        // User validation
        const userId = localStorage.getItem("user_id");

        if (!userId) {
            alert("You must be logged in to place an order!");
            return;
        }

        // Pending order validation
        if (!pendingOrder) {
            alert("No pending order found!");
            return;
        }

        isSubmitting = true;

        // Payload
        const payload = {
            user_id: userId,
            order_number: pendingOrder.order_number,
            cart_list: pendingOrder.cart_list,
            total_price: pendingOrder.total_price,

            delivery_name: deliveryName,
            delivery_contact: deliveryContact,
            delivery_address: address
        };

        try {

            const res = await fetch("/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Failed to place order");
            }

            // Save locally
            const saved = {
                order_number: pendingOrder.order_number,
                delivery_name: deliveryName,
                delivery_contact: deliveryContact,
                delivery_address: address
            };

            localStorage.setItem(
                "lastOrder",
                JSON.stringify(saved)
            );

            // Update popup
            document.querySelectorAll(".sub-label-name").forEach(el => {
                el.textContent = `Deliver To: ${deliveryName}`;
            });

            document.querySelectorAll(".sub-label-contact").forEach(el => {
                el.textContent = `Contact Number: ${deliveryContact}`;
            });

            document.querySelectorAll(".sub-label-address").forEach(el => {
                el.textContent = `Delivery Address: ${address}`;
            });

            // Show popup
            if (orderPopup) {
                orderPopup.style.display = "flex";
            }

            const orderNumberEl = document.querySelector(".order-reservation-number");

            if (orderNumberEl) {
                orderNumberEl.textContent =
                    `#${pendingOrder.order_number}`;
            }

            // Reset
            confirmPopup.style.display = "none";

            cart = [];
            total = 0;
            pendingOrder = null;

            updateUI();

        } catch (err) {

            console.error(err);
            alert(err.message);

        } finally {

            isSubmitting = false;

        }
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
                if (contactInput) {
                    let phone = user.phone_number.toString().replace(/\D/g, "");

                    // add 0 only if it doesn't already start with 0
                    if (!phone.startsWith("0")) {
                        phone = "0" + phone;
                    }

                    contactInput.value = phone;
                }
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