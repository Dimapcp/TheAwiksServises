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
    } else {
        users.push({
            name,
            email,
            role,
            pending: 0,
            ready: 0,
            money: 0
        });
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
});

document.getElementById("addReadyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    if (!user) return;
    user.ready++;
    saveToStorage();
    renderUsers();
});

document.getElementById("addMoneyBtn")?.addEventListener("click", () => {
    const user = getSelectedUser();
    const amount = parseInt(document.getElementById("moneyAmount").value);
    if (!user || isNaN(amount)) return;
    user.money += amount;
    saveToStorage();
    renderUsers();
});

document.getElementById("deleteUserBtn")?.addEventListener("click", () => {
    const index = document.getElementById("userSelect").value;
    if (index === "") return;
    users.splice(index, 1);
    saveToStorage();
    renderUsers();
});

renderUsers();

});
