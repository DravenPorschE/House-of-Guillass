document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    const accountCreationForm = document.querySelector(".account-creation-form");
    const accountView = document.querySelector(".account-view");

    const logoutBtn = document.getElementById("logout-btn");
    
    const phoneInput = document.getElementById("phone-input");

    function populateAccountView() {
        const storedData = localStorage.getItem("user_data");
        if (!storedData) return;

        const user = JSON.parse(storedData);

        // Populate Text Fields
        document.getElementById("display-fullname").textContent = user.full_name;
        document.getElementById("display-username").textContent = `@${user.username}`;
        document.getElementById("view-email").textContent = user.email;
        document.getElementById("view-phone").textContent = user.phone;

        // Generate Initials (e.g., "John Doe" -> "JD")
        const initials = user.full_name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2); // Get first 2 letters
        
        document.getElementById("user-initials").textContent = initials || "??";
    }

    phoneInput?.addEventListener("input", () => {

        // remove non-numbers
        phoneInput.value = phoneInput.value.replace(/\D/g, "");

        // limit to 11 digits
        phoneInput.value = phoneInput.value.slice(0, 11);

    });

    if(isLoggedIn) {
        accountCreationForm.style.display = "none";
        accountView.style.display = "flex";
        populateAccountView(); // Run the population logic
    } else {
        accountCreationForm.style.display = "flex";
        accountView.style.display = "none";
    }
    
    const mobileQuery = window.matchMedia("(max-width: 700px)");

    const viewMobile = document.getElementById("view-mobile");
    const viewPC = document.getElementById("view-pc");

    const menuIcons = document.querySelectorAll("#menu");
    const navLists = document.querySelectorAll("#nav-list");

    // buttons
    const btnSignup = document.getElementById("signup-btn");
    const btnLogin = document.getElementById("login-btn");

    // ✅ Handle switching between mobile & desktop
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

    // handle account creation/signup
    btnSignup.addEventListener("click", async () => {

        // 1. Grab the elements
        const fullnameInput = document.getElementById("fullname-input");
        const usernameInput = document.getElementById("username-input");
        const emailInput = document.getElementById("email-input");
        const passwordInput = document.getElementById("password-input");
        const confirmPassInput = document.getElementById("confirm-pass-input");

        // 2. Compare the VALUES (using .value)
        if (passwordInput.value !== confirmPassInput.value) {
            alert("Password and Confirm Password are not the same");
            return; // Stop the function here so it doesn't call fetch
        }

        const phoneInput = document.getElementById("phone-input");
        const phoneNumber = phoneInput.value.trim();

        // ✅ Philippine phone validation
        const phoneRegex = /^09\d{9}$/;

        if (!phoneRegex.test(phoneNumber)) {
            alert("Please enter a valid Philippine phone number (09XXXXXXXXX)");
            return;
        }

        // 3. Prepare the data object
        const userData = {
            full_name: fullnameInput.value,
            phone_number: phoneInput.value,
            username: usernameInput.value,
            email: emailInput.value,
            password: passwordInput.value
        };

        try {
            // 4. Send the POST request to your Express server
            const response = await fetch("/create-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Account created successfully!");
                localStorage.setItem("user_id", result.user_id);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("user_data", JSON.stringify(userData)); // Save the data for the view
                window.location.href = "/";
                window.location.href = "/"; 
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Something went wrong with the server connection.");
        }
    });

    // handle account login
    btnLogin.addEventListener("click", async () => {
        // 1. Grab the elements
        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        // 2. Simple Validation
        if (!usernameInput.value || !passwordInput.value) {
            alert("Please enter both username and password");
            return;
        }

        // 3. Prepare data
        const loginData = {
            username: usernameInput.value,
            password: passwordInput.value
        };

        try {
            // 4. Send POST request to your login endpoint
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Welcome back, " + result.full_name + "!");
                
                // 5. Store session data
                localStorage.setItem("user_id", result.user_id);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("user_data", JSON.stringify(result)); // Store full name, etc.

                // 6. Redirect to home or update the view
                window.location.href = "../index.html"; 
            } else {
                // Error from server (e.g., "Invalid credentials")
                alert(result.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Server connection failed.");
        }
    });

    logoutBtn.addEventListener("click", () => {
        if(confirm("Are you sure you want to log out?")) {
            // localStorage.removeItem("isLoggedIn");
            localStorage.clear();

            window.location.href = "/";
        }
    });
});