// ===============================
// SIMPLE AUTH (100% GitHub Safe)
// ===============================

// ---------- STORAGE ----------
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
        localStorage.removeItem("currentUser");
    }
    updateAuthUI();
}

function logout() {
    setCurrentUser(null);
    window.location.href = "login.html";
}

// ---------- REGISTER ----------
function register(name, email, password) {
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        alert("User already exists");
        return false;
    }

    const user = {
        name: name.trim(),
        email: email.trim(),
        password: password, // БЕЗ ШИФРОВКИ
        role: "user",
        orders_pending: 0,
        orders_ready: 0,
        money_invested: 0
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser(user);

    return true;
}

// ---------- LOGIN ----------
function login(email, password) {
    const users = getUsers();

    const user = users.find(u =>
        u.email === email.trim() &&
        u.password === password
    );

    if (!user) {
        alert("Invalid email or password");
        return false;
    }

    setCurrentUser(user);
    return true;
}

// ---------- UI ----------
function updateAuthUI() {
    const user = getCurrentUser();

    console.log("Auth check:", user);

    const nameEls = document.querySelectorAll(".user-name");
    const emailEls = document.querySelectorAll(".user-email");

    nameEls.forEach(el => {
        el.textContent = user ? user.name : "Not signed in";
    });

    emailEls.forEach(el => {
        el.textContent = user ? user.email : "-";
    });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", function () {
    updateAuthUI();

    window.addEventListener("storage", function (e) {
        if (e.key === "currentUser") {
            updateAuthUI();
        }
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
});
