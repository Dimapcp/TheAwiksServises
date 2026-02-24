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
        const u = findUser(email);
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
        if(getCurrentUser()) return;
        window.location.href = 'login.html';
    };

    // react to storage changes from other tabs
    window.addEventListener('storage', function(e){
        if(e.key === KEYS.USERS || e.key === KEYS.CURRENT_EMAIL || e.key === KEYS.CURRENT_OBJ){
            dispatchAuthChange();
        }
    });

})();
