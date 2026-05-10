document.addEventListener("DOMContentLoaded", () => {
    async function autoFillUserDetails() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            const res = await fetch(`/fetch-account/${userId}`);
            const user = await res.json();

            if (res.ok) {

                // normalize phone number
                let phone = user.phone_number?.toString().replace(/\D/g, "") || "";

                // add leading 0 if missing
                if (phone && !phone.startsWith("0")) {
                    phone = "0" + phone;
                }

                // 1. Checkout / Delivery
                const deliveryName = document.querySelector(".delivery-name");
                const deliveryContact = document.querySelector(".delivery-contact");

                if (deliveryName) {
                    deliveryName.value = user.full_name;
                }

                if (deliveryContact) {
                    deliveryContact.value = phone;
                }

                // 2. Table Reservation
                const resName = document.getElementById("res-name");
                const resContact = document.getElementById("res-contact");

                if (resName) {
                    resName.value = user.full_name;
                }

                if (resContact) {
                    resContact.value = phone;
                }
            }

        } catch (err) {
            console.error("Could not fetch user details for auto-fill", err);
        }
    }

    autoFillUserDetails();
});