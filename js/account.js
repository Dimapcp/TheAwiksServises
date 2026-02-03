// Simple account page logic: read current user and show info, implement chat saved in localStorage
(function(){
    function getCurrentUser(){
        try{return JSON.parse(localStorage.getItem('currentUser')||'null');}catch(e){return null;}
    }
    function loadChat(){
        try{return JSON.parse(localStorage.getItem('dev_chat')||'[]');}catch(e){return [];}
    }
    function saveChat(arr){
        localStorage.setItem('dev_chat', JSON.stringify(arr));
    }

    function renderUser(){
        const u = getCurrentUser();
        if(!u){
            document.getElementById('u_name').textContent = 'Not signed in';
            const avat = document.getElementById('u_avatar'); if(avat) avat.style.display='none';
            return;
        }
        document.getElementById('u_name').textContent = u.name||'-';
        const avat = document.getElementById('u_avatar'); if(avat){ if(u.avatar){ avat.src = u.avatar; avat.style.display='block'; } else { avat.style.display='none'; } }
        document.getElementById('u_email').textContent = u.email||'-';
        document.getElementById('u_pending').textContent = u.orders_pending||0;
        document.getElementById('u_ready').textContent = u.orders_ready||0;
        document.getElementById('u_money').textContent = u.money_invested||0;
    }

    function renderChat(){
        const chat = loadChat();
        const win = document.getElementById('chatWindow');
        if(!win) return;
        win.innerHTML = '';
        chat.forEach(m => {
            const el = document.createElement('div');
            el.style.padding = '6px';
            el.style.borderBottom = '1px solid #eee';
            el.innerHTML = '<strong>'+escapeHtml(m.user)+'</strong>: '+escapeHtml(m.message)+' <span style="color:#999;font-size:0.8em">('+m.time+')</span>';
            win.appendChild(el);
        });
        win.scrollTop = win.scrollHeight;
    }

    function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

    function showConfirmModal(title, message, onConfirm){
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
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
            padding: 40px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        `;
        
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.cssText = 'margin: 0 0 12px 0; color: #1f2937; font-size: 20px;';
        
        const msgEl = document.createElement('p');
        msgEl.textContent = message;
        msgEl.style.cssText = 'margin: 0 0 24px 0; color: #6b7280; font-size: 14px;';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 12px;
            transition: background 0.2s;
        `;
        confirmBtn.onmouseover = () => confirmBtn.style.background = '#dc2626';
        confirmBtn.onmouseout = () => confirmBtn.style.background = '#ef4444';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        `;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#e5e7eb';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#f3f4f6';
        
        confirmBtn.addEventListener('click', function(){
            document.body.removeChild(modal);
            onConfirm();
        });
        
        cancelBtn.addEventListener('click', function(){
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', function(e){
            if(e.target === modal) document.body.removeChild(modal);
        });
        
        card.appendChild(titleEl);
        card.appendChild(msgEl);
        card.appendChild(confirmBtn);
        card.appendChild(cancelBtn);
        modal.appendChild(card);
        document.body.appendChild(modal);
    }

    function uploadAvatarFile(){
        console.log('uploadAvatarFile called');
        const fileInput = document.getElementById('avatarFileInput');
        console.log('fileInput:', fileInput);
        if(!fileInput) { alert('File input not found'); return; }
        const file = fileInput.files[0];
        console.log('file selected:', file);
        if(!file) { alert('Please select a file'); return; }
        if(!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
        
        const reader = new FileReader();
        reader.onload = function(e){
            console.log('file loaded');
            const dataURL = e.target.result;
            const user = getCurrentUser();
            console.log('current user:', user);
            if(!user) { alert('Not logged in'); return; }
            user.avatar = dataURL;
            console.log('setting avatar');
            if(window._auth && window._auth.setCurrentUser) { 
                window._auth.setCurrentUser(user);
                console.log('avatar saved via auth');
            }
            renderUser();
            fileInput.value = '';
            alert('Avatar updated!');
        };
        reader.readAsDataURL(file);
    }

    function init(){
        console.log('account.js init() called');
        renderUser();
        
        const chatWindow = document.getElementById('chatWindow');
        const sendChatBtn = document.getElementById('sendChat');
        if(chatWindow && sendChatBtn){
            renderChat();
            sendChatBtn.addEventListener('click', function(){
                const input = document.getElementById('chatInput');
                const msg = input.value.trim();
                if(!msg) return;
                const user = getCurrentUser();
                const username = user?user.name:'Guest';
                const chat = loadChat();
                chat.push({ user: username, message: msg, time: new Date().toLocaleString() });
                saveChat(chat);
                input.value = '';
                renderChat();
            });
        }

        const uploadBtn = document.getElementById('uploadAvatarBtn');
        console.log('uploadBtn found:', uploadBtn);
        if(uploadBtn) uploadBtn.addEventListener('click', uploadAvatarFile);

        const logoutBottom = document.getElementById('logoutBottomBtn');
        console.log('logoutBottom found:', logoutBottom);
        if(logoutBottom) logoutBottom.addEventListener('click', function(){
            console.log('logout clicked');
            showConfirmModal('Logout', 'Are you sure you want to logout?', function(){
                console.log('logout confirmed');
                if(window._auth && window._auth.logout) window._auth.logout();
                renderUser();
                alert('You have been logged out');
            });
        });

        const deleteBtn = document.getElementById('deleteAccountBtn');
        console.log('deleteBtn found:', deleteBtn);
        if(deleteBtn) deleteBtn.addEventListener('click', function(){
            console.log('delete clicked');
            showConfirmModal('Delete Account', 'Are you sure? This action is permanent and cannot be undone.', function(){
                console.log('delete confirmed');
                if(window._auth && window._auth.deleteCurrentAccount){
                    const ok = window._auth.deleteCurrentAccount();
                    if(ok){
                        alert('Account deleted successfully');
                        location.href = 'index.html';
                    }else{
                        alert('No account to delete');
                    }
                }else{
                    alert('Delete function unavailable');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
