// ===============================
// AUTH.JS — Stable GitHub Version
// ===============================


// ---------- SHA256 (sync wrapper) ----------
function sha256Sync(str) {
    const buffer = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", buffer)
        .then(hash => {
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        });
}


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
async function register(name, email, password) {
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        alert("User already exists");
        return false;
    }

    const hashed = await sha256Sync(password);

    const user = {
        name: name.trim(),
        email: email.trim(),
        passwordHash: hashed,
        avatar: "",
        orders_pending: 0,
        orders_ready: 0,
        money_invested: 0,
        role: "user"
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser(user);

    return true;
}


// ---------- LOGIN ----------
async function login(email, password) {
    const users = getUsers();
    const hashed = await sha256Sync(password);

    const user = users.find(u =>
        u.email === email.trim() &&
        u.passwordHash === hashed
    );

    if (!user) {
        alert("Invalid email or password");
        return false;
    }

    setCurrentUser(user);
    return true;
}


// ---------- UI UPDATE ----------
function updateAuthUI() {
    const user = getCurrentUser();

    console.log("updateAuthUI:", user);

    const nameEls = document.querySelectorAll(".user-name");
    const emailEls = document.querySelectorAll(".user-email");
    const authAreas = document.querySelectorAll(".auth-area");

    authAreas.forEach(area => {
        area.style.display = user ? "block" : "none";
    });

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

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    // Sync between tabs
    window.addEventListener("storage", function (e) {
        if (e.key === "currentUser") {
            updateAuthUI();
        }
    });
});
