document.addEventListener("DOMContentLoaded", () => {
    async function autoFillUserDetails() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            const res = await fetch(`/fetch-account/${userId}`);
            const user = await res.json();

            if (res.ok) {
                // 1. For the Checkout/Delivery section
                const deliveryName = document.querySelector(".delivery-name");
                const deliveryContact = document.querySelector(".delivery-contact");
                
                if (deliveryName) deliveryName.value = user.full_name;
                if (deliveryContact) deliveryContact.value = user.phone_number;

                // 2. For the Table Reservation Form section
                const resName = document.getElementById("res-name");
                const resContact = document.getElementById("res-contact");

                if (resName) resName.value = user.full_name;
                if (resContact) resContact.value = user.phone_number;
            }
        } catch (err) {
            console.error("Could not fetch user details for auto-fill", err);
        }
    }

    autoFillUserDetails();
});