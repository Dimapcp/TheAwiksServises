(function(){

document.addEventListener('DOMContentLoaded', init);

/* ============================= */
/* ===== DATA LAYER ============ */
/* ============================= */

function getUsers(){
    try{
        return JSON.parse(localStorage.getItem('users') || '[]');
    }catch(e){
        return [];
    }
}

function saveUsers(users){
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser(){
    const email = localStorage.getItem('currentUserEmail');
    if(!email) return null;
    const users = getUsers();
    return users.find(u => u.email === email) || null;
}

function updateCurrentUser(updatedData){
    const email = localStorage.getItem('currentUserEmail');
    if(!email) return;

    let users = getUsers();

    users = users.map(u => {
        if(u.email === email){
            return { ...u, ...updatedData };
        }
        return u;
    });

    saveUsers(users);
}

/* ============================= */
/* ===== USER RENDER =========== */
/* ============================= */

function renderUser(){
    const u = getCurrentUser();

    const nameEl = document.getElementById('u_name');
    const emailEl = document.getElementById('u_email');
    const pendingEl = document.getElementById('u_pending');
    const readyEl = document.getElementById('u_ready');
    const moneyEl = document.getElementById('u_money');
    const avatarEl = document.getElementById('u_avatar');

    if(!u){
        if(nameEl) nameEl.textContent = 'Not signed in';
        if(emailEl) emailEl.textContent = '-';
        if(pendingEl) pendingEl.textContent = 0;
        if(readyEl) readyEl.textContent = 0;
        if(moneyEl) moneyEl.textContent = 0;
        if(avatarEl) avatarEl.style.display = 'none';
        return;
    }

    if(nameEl) nameEl.textContent = u.name || '-';
    if(emailEl) emailEl.textContent = u.email || '-';
    if(pendingEl) pendingEl.textContent = u.pending || 0;
    if(readyEl) readyEl.textContent = u.ready || 0;
    if(moneyEl) moneyEl.textContent = u.money || 0;

    if(avatarEl){
        if(u.avatar){
            avatarEl.src = u.avatar;
            avatarEl.style.display = 'block';
        }else{
            avatarEl.style.display = 'none';
        }
    }
}

/* ============================= */
/* ===== CHAT =================== */
/* ============================= */

function loadChat(){
    try{
        return JSON.parse(localStorage.getItem('dev_chat') || '[]');
    }catch(e){
        return [];
    }
}

function saveChat(arr){
    localStorage.setItem('dev_chat', JSON.stringify(arr));
}

function renderChat(){
    const win = document.getElementById('chatWindow');
    if(!win) return;

    const chat = loadChat();
    win.innerHTML = '';

    chat.forEach(m => {
        const el = document.createElement('div');
        el.style.padding = '6px';
        el.style.borderBottom = '1px solid #eee';
        el.innerHTML =
            '<strong>' + escapeHtml(m.user) + '</strong>: ' +
            escapeHtml(m.message) +
            ' <span style="color:#999;font-size:0.8em">(' +
            m.time +
            ')</span>';
        win.appendChild(el);
    });

    win.scrollTop = win.scrollHeight;
}

function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
        return {
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'
        }[c];
    });
}

/* ============================= */
/* ===== AVATAR ================= */
/* ============================= */

function uploadAvatarFile(){
    const fileInput = document.getElementById('avatarFileInput');
    if(!fileInput) return;

    const file = fileInput.files[0];
    if(!file) return alert('Select file');
    if(!file.type.startsWith('image/')) return alert('Image only');

    const reader = new FileReader();
    reader.onload = function(e){
        updateCurrentUser({ avatar: e.target.result });
        renderUser();
        fileInput.value = '';
        alert('Avatar updated');
    };
    reader.readAsDataURL(file);
}

/* ============================= */
/* ===== MODAL ================== */
/* ============================= */

function showConfirmModal(title, message, onConfirm){
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;

    card.innerHTML = `
        <h2>${title}</h2>
        <p>${message}</p>
        <button id="confirmBtn" style="background:#ef4444;color:white;padding:10px;width:100%;margin-bottom:10px;border:none;border-radius:6px;">Confirm</button>
        <button id="cancelBtn" style="background:#eee;padding:10px;width:100%;border:none;border-radius:6px;">Cancel</button>
    `;

    modal.appendChild(card);
    document.body.appendChild(modal);

    document.getElementById('confirmBtn').onclick = function(){
        document.body.removeChild(modal);
        onConfirm();
    };

    document.getElementById('cancelBtn').onclick = function(){
        document.body.removeChild(modal);
    };

    modal.onclick = function(e){
        if(e.target === modal){
            document.body.removeChild(modal);
        }
    };
}

/* ============================= */
/* ===== INIT =================== */
/* ============================= */

function init(){

    renderUser();
    renderChat();

    const sendChatBtn = document.getElementById('sendChat');
    if(sendChatBtn){
        sendChatBtn.addEventListener('click', function(){
            const input = document.getElementById('chatInput');
            if(!input) return;

            const msg = input.value.trim();
            if(!msg) return;

            const user = getCurrentUser();
            const username = user ? user.name : 'Guest';

            const chat = loadChat();
            chat.push({
                user: username,
                message: msg,
                time: new Date().toLocaleString()
            });

            saveChat(chat);
            input.value = '';
            renderChat();
        });
    }

    const uploadBtn = document.getElementById('uploadAvatarBtn');
    if(uploadBtn) uploadBtn.addEventListener('click', uploadAvatarFile);

    const logoutBtn = document.getElementById('logoutBottomBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', function(){
            showConfirmModal('Logout','Are you sure?', function(){
                localStorage.removeItem('currentUserEmail');
                renderUser();
                alert('Logged out');
            });
        });
    }

    const deleteBtn = document.getElementById('deleteAccountBtn');
    if(deleteBtn){
        deleteBtn.addEventListener('click', function(){
            showConfirmModal('Delete Account','This cannot be undone.', function(){

                const email = localStorage.getItem('currentUserEmail');
                if(!email) return;

                let users = getUsers();
                users = users.filter(u => u.email !== email);

                saveUsers(users);
                localStorage.removeItem('currentUserEmail');

                alert('Account deleted');
                location.href = 'index.html';
            });
        });
    }

}

})();
})();
