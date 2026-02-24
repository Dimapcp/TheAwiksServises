// let users = JSON.parse(localStorage.getItem("users")) || [];

// function saveToStorage() {
//     localStorage.setItem("users", JSON.stringify(users));
// }

// function renderUsers() {
//     const select = document.getElementById("userSelect");
//     const table = document.querySelector("#usersTable tbody");

//     if (!select || !table) return;

//     select.innerHTML = "";
//     table.innerHTML = "";

//     users.forEach((user, index) => {

//         select.innerHTML += `<option value="${index}">${user.name}</option>`;

//         table.innerHTML += `
//             <tr>
//                 <td>${user.name}</td>
//                 <td>${user.email}</td>
//                 <td>${user.role}</td>
//                 <td>${user.pending}</td>
//                 <td>${user.ready}</td>
//                 <td>${user.money}</td>
//             </tr>
//         `;
//     });
// }

// function getSelectedUser() {
//     const index = document.getElementById("userSelect").value;
//     return users[index];
// }

// /* --- КНОПКИ --- */

// document.getElementById("saveUserBtn")?.addEventListener("click", () => {

//     const name = document.getElementById("dev_name").value;
//     const email = document.getElementById("dev_email").value;
//     const role = document.getElementById("dev_role").value;

//     if (!name || !email) return alert("Fill fields");

//     let existing = users.find(u => u.email === email);

//     if (existing) {
//         existing.name = name;
//         existing.role = role;
//     } else {
//         users.push({
//             name,
//             email,
//             role,
//             pending: 0,
//             ready: 0,
//             money: 0
//         });
//     }

//     saveToStorage();
//     renderUsers();
// });

// document.getElementById("addPendingBtn")?.addEventListener("click", () => {
//     const user = getSelectedUser();
//     if (!user) return;
//     user.pending++;
//     saveToStorage();
//     renderUsers();
// });

// document.getElementById("addReadyBtn")?.addEventListener("click", () => {
//     const user = getSelectedUser();
//     if (!user) return;
//     user.ready++;
//     saveToStorage();
//     renderUsers();
// });

// document.getElementById("addMoneyBtn")?.addEventListener("click", () => {
//     const user = getSelectedUser();
//     const amount = parseInt(document.getElementById("moneyAmount").value);
//     if (!user || !amount) return;
//     user.money += amount;
//     saveToStorage();
//     renderUsers();
// });

// document.getElementById("deleteUserBtn")?.addEventListener("click", () => {
//     const index = document.getElementById("userSelect").value;
//     if (index === "") return;
//     users.splice(index, 1);
//     saveToStorage();
//     renderUsers();
// });

// renderUsers();
document.addEventListener("DOMContentLoaded", () => {

let users = JSON.parse(localStorage.getItem("users")) || [];

function saveToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function renderUsers() {
    const select = document.getElementById("userSelect");
    const table = document.querySelector("#usersTable tbody");

    if (!select || !table) return;

    select.innerHTML = "";
    table.innerHTML = "";

    users.forEach((user, index) => {

        select.innerHTML += `<option value="${index}">${user.name}</option>`;

        table.innerHTML += `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.pending}</td>
                <td>${user.ready}</td>
                <td>${user.money}</td>
            </tr>
        `;
    });
}

// --- attention / notifications ---
function addAttention(msg){
    const area = document.getElementById('devNotifications');
    if(!area) return;
    const el = document.createElement('div');
    el.style.cssText = 'background:#fff3cd;border:1px solid #ffeeba;padding:10px;margin-bottom:8px;border-radius:6px;color:#856404;display:flex;justify-content:space-between;align-items:center;gap:12px;';
    el.innerHTML = `<span>${msg}</span><button style="background:transparent;border:none;cursor:pointer;font-weight:700">✕</button>`;
    const btn = el.querySelector('button');
    btn.addEventListener('click', ()=> el.remove());
    area.insertBefore(el, area.firstChild);
}

function getSelectedUser() {
    const index = document.getElementById("userSelect").value;
    return users[index];
}

/* --- КНОПКИ --- */

document.getElementById("saveUserBtn")?.addEventListener("click", () => {

    const name = document.getElementById("dev_name").value;
    const email = document.getElementById("dev_email").value;
    const role = document.getElementById("dev_role").value;

    if (!name || !email) {
        alert("Fill all fields");
        return;
    }

    let existing = users.find(u => u.email === email);

    if (existing) {
        existing.name = name;
        existing.role = role;
        addAttention('Updated user "' + name + '"');
    } else {
        users.push({
            name,
            email,
            role,
            pending: 0,
            ready: 0,
            money: 0
        });
        addAttention('Created user "' + name + '"');
    }

    saveToStorage();
    renderUsers();
});

document.getElementById("addPendingBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    if (!user) return;
    user.pending++;
    saveToStorage();
    renderUsers();
    addAttention('Incremented pending for "' + user.name + '"');
});

document.getElementById("subPendingBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    if (!user) return;
    if (user.pending > 0) user.pending--;
    saveToStorage();
    renderUsers();
    addAttention('Decremented pending for "' + user.name + '"');
});

document.getElementById("addReadyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    if (!user) return;
    user.ready++;
    saveToStorage();
    renderUsers();
    addAttention('Incremented ready for "' + user.name + '"');
});

document.getElementById("subReadyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    if (!user) return;
    if (user.ready > 0) user.ready--;
    saveToStorage();
    renderUsers();
    addAttention('Decremented ready for "' + user.name + '"');
});

document.getElementById("addMoneyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    const amount = parseInt(document.getElementById("moneyAmount").value);
    if (!user || isNaN(amount)) return;
    user.money += amount;
    saveToStorage();
    renderUsers();
    addAttention('Added ' + amount + ' money to "' + user.name + '"');
});

document.getElementById("subMoneyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    const amount = parseInt(document.getElementById("moneyAmount").value);
    if (!user || isNaN(amount)) return;
    user.money -= amount;
    if (user.money < 0) user.money = 0;
    saveToStorage();
    renderUsers();
    addAttention('Subtracted ' + amount + ' money from "' + user.name + '"');
});

document.getElementById("deleteUserBtn")?.addEventListener("click", () => {
    const index = document.getElementById("userSelect").value;
    if (index === "") return;
    users.splice(index, 1);
    saveToStorage();
    renderUsers();
    addAttention('Deleted user at index ' + index);
});

renderUsers();
// show a small start notification to verify notifications area
if(document.getElementById('devNotifications')){
    addAttention('Admin panel loaded');
}
});
