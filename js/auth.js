// ===============================
// SIMPLE AUTH (100% GitHub Safe)
// ===============================

// New unified auth module
(function(){
    const KEYS = {
        USERS: 'users',
        CURRENT_EMAIL: 'currentUserEmail',
        CURRENT_OBJ: 'currentUser'
    };

    function loadUsers(){
        try{ return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }catch(e){ return []; }
    }

    function saveUsers(users){
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    function findUser(email){
        if(!email) return null;
        const users = loadUsers();
        return users.find(u => u.email === String(email).trim()) || null;
    }

    function migrateLegacy(){
        // If there is a `currentUser` object stored, ensure currentUserEmail exists
        try{
            const cu = JSON.parse(localStorage.getItem(KEYS.CURRENT_OBJ) || 'null');
            if(cu && cu.email && !localStorage.getItem(KEYS.CURRENT_EMAIL)){
                localStorage.setItem(KEYS.CURRENT_EMAIL, cu.email);
            }
        }catch(e){}
    }

    function getCurrentUser(){
        migrateLegacy();
        const email = localStorage.getItem(KEYS.CURRENT_EMAIL);
        const u = findUser(email);
        return u ? u : null;
    }

    function setCurrentUserByEmail(email){
        if(email){
            localStorage.setItem(KEYS.CURRENT_EMAIL, String(email));
            const u = findUser(email);
            try{ localStorage.setItem(KEYS.CURRENT_OBJ, JSON.stringify(u || null)); }catch(e){}
        }else{
            localStorage.removeItem(KEYS.CURRENT_EMAIL);
            localStorage.removeItem(KEYS.CURRENT_OBJ);
        }
        dispatchAuthChange();
    }

    function register(name, email, password){
        if(!email || !password) return { ok:false, error:'Missing fields' };
        email = String(email).trim();
        const users = loadUsers();
        if(users.find(u => u.email === email)) return { ok:false, error:'User exists' };
        const user = {
            name: String(name || '').trim() || 'User',
            email: email,
            password: String(password),
            role: 'user',
            pending: 0,
            ready: 0,
            money: 0,
            avatar: null
        };
        users.push(user);
        saveUsers(users);
        setCurrentUserByEmail(email);
        return { ok:true, user };
    }

    function login(email, password){
        if(!email || !password) return { ok:false };
        const key = String(email).trim();
        let u = findUser(key);
        // try by name (case-insensitive) if not found by email
        if(!u){
            const users = loadUsers();
            const lowered = key.toLowerCase();
            u = users.find(x => (x.name && String(x.name).toLowerCase() === lowered) || (x.email && String(x.email).toLowerCase() === lowered)) || null;
        }
        if(!u || u.password !== String(password)) return { ok:false };
        setCurrentUserByEmail(u.email);
        return { ok:true, user:u };
    }

    function logout(){
        setCurrentUserByEmail(null);
        // keep user on page; many pages expect redirect handled elsewhere
    }

    function updateCurrentUser(updates){
        const email = localStorage.getItem(KEYS.CURRENT_EMAIL);
        if(!email) return null;
        const users = loadUsers();
        const idx = users.findIndex(u=>u.email===email);
        if(idx===-1) return null;
        users[idx] = Object.assign({}, users[idx], updates);
        saveUsers(users);
        try{ localStorage.setItem(KEYS.CURRENT_OBJ, JSON.stringify(users[idx])); }catch(e){}
        dispatchAuthChange();
        return users[idx];
    }

    function deleteCurrentUser(){
        const email = localStorage.getItem(KEYS.CURRENT_EMAIL);
        if(!email) return false;
        let users = loadUsers();
        users = users.filter(u=>u.email!==email);
        saveUsers(users);
        logout();
        return true;
    }

    function dispatchAuthChange(){
        try{ window.dispatchEvent(new CustomEvent('auth-changed')); }catch(e){}
    }

    // expose API
    const API = {
        getCurrentUser,
        register,
        login,
        logout,
        updateCurrentUser,
        deleteCurrentUser
    };

    // Provide window.Auth and legacy window._auth
    window.Auth = API;
    if(!window._auth) window._auth = {};
    window._auth.showQuickLoginPrompt = function(){
        if(getCurrentUser()){
            syncHeaderUI();
            return;
        }

        // build modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10010;';

        const card = document.createElement('div');
        card.style.cssText = 'background:#fff;padding:18px;border-radius:10px;max-width:420px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:inherit;';

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="margin:0;font-size:18px">Sign in or Register</h3>
                <button id="_auth_close" style="background:transparent;border:none;font-size:18px;cursor:pointer">✕</button>
            </div>
            <div id="_auth_forms">
                <form id="loginFormQuick" style="display:block;">
                    <input id="loginEmail" type="text" placeholder="Email" required style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <input id="loginPass" type="password" placeholder="Password" required style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <div id="loginErr" style="color:#b00020;display:none;margin-bottom:8px;font-size:13px"></div>
                    <button type="submit" style="width:100%;padding:10px;background:#2f78ff;color:#fff;border:none;border-radius:6px;cursor:pointer">Sign in</button>
                </form>

                <form id="regFormQuick" style="display:none;margin-top:12px;">
                    <input id="regName" type="text" placeholder="Name" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <input id="regEmail" type="text" placeholder="Email" required style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <input id="regPass" type="password" placeholder="Password" required style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <div id="regErr" style="color:#b00020;display:none;margin-bottom:8px;font-size:13px"></div>
                    <button type="submit" style="width:100%;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer">Register</button>
                </form>
            </div>
            <div style="margin-top:12px;text-align:center;font-size:13px;color:#444">
                <a href="#" id="switchToReg">Create account</a> · <a href="#" id="switchToLogin">Sign in</a>
            </div>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);

        function close(){
            try{ document.body.removeChild(modal); }catch(e){}
        }

        modal.addEventListener('click', function(e){ if(e.target===modal) close(); });
        card.querySelector('#_auth_close').addEventListener('click', close);

        const loginForm = card.querySelector('#loginFormQuick');
        const regForm = card.querySelector('#regFormQuick');
        const loginErr = card.querySelector('#loginErr');
        const regErr = card.querySelector('#regErr');

        card.querySelector('#switchToReg').addEventListener('click', function(e){ e.preventDefault(); loginForm.style.display='none'; regForm.style.display='block'; loginErr.style.display='none'; regErr.style.display='none'; });
        card.querySelector('#switchToLogin').addEventListener('click', function(e){ e.preventDefault(); loginForm.style.display='block'; regForm.style.display='none'; loginErr.style.display='none'; regErr.style.display='none'; });

        loginForm.addEventListener('submit', function(e){
            e.preventDefault();
            const email = card.querySelector('#loginEmail').value.trim();
            const pass = card.querySelector('#loginPass').value;
            // prefer using public API if available
            let res;
            try{
                if(window.Auth && typeof window.Auth.login === 'function'){
                    res = window.Auth.login(email, pass);
                } else {
                    res = login(email, pass);
                }
            }catch(err){
                console.error('Login error', err);
                loginErr.textContent = 'Login error'; loginErr.style.display='block';
                return;
            }
            console.log('Login result', res);
            if(res && res.ok){
                close();
                dispatchAuthChange();
                try{ syncHeaderUI(); }catch(e){}
                // ensure header updates across tabs
                alert('Signed in');
                return;
            }
            loginErr.textContent = 'Invalid credentials'; loginErr.style.display='block';
        });

        regForm.addEventListener('submit', function(e){
            e.preventDefault();
            const name = card.querySelector('#regName').value.trim();
            const email = card.querySelector('#regEmail').value.trim();
            const pass = card.querySelector('#regPass').value;
            let res;
            try{
                if(window.Auth && typeof window.Auth.register === 'function'){
                    res = window.Auth.register(name, email, pass);
                } else {
                    res = register(name, email, pass);
                }
            }catch(err){
                console.error('Register error', err);
                regErr.textContent = 'Register error'; regErr.style.display='block';
                return;
            }
            console.log('Register result', res);
            if(res && res.ok){
                close();
                dispatchAuthChange();
                try{ syncHeaderUI(); }catch(e){}
                alert('Account created and signed in');
                return;
            }
            regErr.textContent = (res && res.error) ? res.error : 'Failed to register'; regErr.style.display='block';
        });

        // focus first input
        setTimeout(()=>{ const f = card.querySelector('#loginEmail'); if(f) f.focus(); },50);
    };

    // react to storage changes from other tabs
    window.addEventListener('storage', function(e){
        if(e.key === KEYS.USERS || e.key === KEYS.CURRENT_EMAIL || e.key === KEYS.CURRENT_OBJ){
            dispatchAuthChange();
        }
    });

    // Basic UI sync for header/account elements used across pages
    function syncHeaderUI(){
        const user = getCurrentUser();

        // avatar
        try{
            const avatarEl = document.getElementById('authAvatar');
            if(avatarEl){
                if(user && user.avatar){ avatarEl.src = user.avatar; avatarEl.style.display = 'block'; }
                else { avatarEl.style.display = 'none'; }
            }
        }catch(e){}

        // account link
        try{
            const acc = document.getElementById('accountLink');
            if(acc){
                if(user){ acc.href = 'account.html'; acc.textContent = 'My Account'; }
                else { acc.href = '#'; acc.textContent = 'Sign in'; }
            }
        }catch(e){}

        // logout button
        try{
            const logoutBtn = document.getElementById('logoutBtn');
            if(logoutBtn){
                if(user){ logoutBtn.style.display = 'inline-block'; }
                else { logoutBtn.style.display = 'none'; }
            }
        }catch(e){}
    }

    window.addEventListener('auth-changed', syncHeaderUI);
    document.addEventListener('DOMContentLoaded', function(){
        syncHeaderUI();
        // ensure account link opens modal when not logged in
        const acc = document.getElementById('accountLink');
        if(acc){
            acc.addEventListener('click', function(e){
                const user = getCurrentUser();
                if(!user){ e.preventDefault(); if(window._auth && typeof window._auth.showQuickLoginPrompt==='function') window._auth.showQuickLoginPrompt(); }
            });
        }
        // attach quick-login buttons
        Array.from(document.querySelectorAll('.logbtn')).forEach(btn=>{
            btn.addEventListener('click', function(e){
                // prevent default navigation if any
                e.preventDefault();
                if(window._auth && typeof window._auth.showQuickLoginPrompt==='function') window._auth.showQuickLoginPrompt();
            });
        });
        // attach logout handler if present
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn){
            logoutBtn.addEventListener('click', function(){
                if(window.Auth && typeof window.Auth.logout === 'function') window.Auth.logout();
                syncHeaderUI();
            });
        }
    });

})();
