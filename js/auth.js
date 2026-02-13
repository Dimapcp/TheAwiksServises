// ===============================
// AUTH.JS (GitHub-ready version)
// ===============================

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


// ===============================
// REGISTER
// ===============================

function register(name, email, password) {
    const users = getUsers();

    const existing = users.find(u => u.email === email);
    if (existing) {
        alert("User already exists");
        return false;
    }

    const user = {
        name,
        email,
        passwordHash: sha256(password),
        avatar: "",
        orders_pending: 0,
        orders_ready: 0,
        money_invested: 0
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser(user);

    return true;
}


// ===============================
// LOGIN
// ===============================

function login(email, password) {
    const users = getUsers();

    const user = users.find(u =>
        u.email === email &&
        u.passwordHash === sha256(password)
    );

    if (!user) {
        alert("Invalid email or password");
        return false;
    }

    setCurrentUser(user);
    return true;
}


// ===============================
// UPDATE UI
// ===============================

function updateAuthUI() {
    const user = getCurrentUser();
    console.log("updateAuthUI called, user:", user);

    const nameElements = document.querySelectorAll(".user-name");
    const emailElements = document.querySelectorAll(".user-email");
    const authAreas = document.querySelectorAll(".auth-area");

    authAreas.forEach(area => {
        if (user) {
            area.classList.add("logged-in");
        } else {
            area.classList.remove("logged-in");
        }
    });

    nameElements.forEach(el => {
        el.textContent = user ? user.name : "Not signed in";
    });

    emailElements.forEach(el => {
        el.textContent = user ? user.email : "-";
    });
}


// ===============================
// INIT
// ===============================

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
const SECRET_KEY = "my_super_secret_key_2026";

async function getKey() {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest(
        "SHA-256",
        enc.encode(SECRET_KEY)
    );

    return crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(data) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ciphertext))
    };
}

async function decrypt(encrypted) {
    const key = await getKey();

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(encrypted.iv) },
        key,
        new Uint8Array(encrypted.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
}
async function setCurrentUser(user) {
    if (user) {
        const encrypted = await encrypt(user);
        localStorage.setItem("currentUser", JSON.stringify(encrypted));
    } else {
        localStorage.removeItem("currentUser");
    }
    updateAuthUI();
}
async function getCurrentUser() {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return null;

    return await decrypt(JSON.parse(stored));
}
