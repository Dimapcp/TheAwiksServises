// Client-side auth: IP-based auto-login + Google Sign-In
(function(){
    async function getIP(){
        try{
            const res = await fetch('https://api.ipify.org?format=json');
            const j = await res.json();
            return j.ip;
        }catch(e){
            return null;
        }
    }

    function saveUsers(users){
        localStorage.setItem('users_by_ip', JSON.stringify(users||{}));
    }
    function loadUsers(){
        try{ return JSON.parse(localStorage.getItem('users_by_ip')||'{}'); }catch(e){return {};}
    }

    function setCurrentUser(user){
        if(user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            // Also update in users_by_ip to persist avatar and other changes
            const ip = user.ip || window._currentIP;
            if(ip && ip !== 'unknown'){
                const users = loadUsers();
                users[ip] = user;
                saveUsers(users);
            }
        }
        else {
            localStorage.removeItem('currentUser');
        }
        updateAuthUI();
    }
    function getCurrentUser(){
        try{return JSON.parse(localStorage.getItem('currentUser')||'null');}catch(e){return null;}
    }

    function registerUserForIP(ip, data){
        const users = loadUsers();
        users[ip] = data;
        saveUsers(users);
        setCurrentUser(data);
    }

    function logout(){
        setCurrentUser(null);
        // Also sign out from Google if available
        if(window.google && window.google.accounts){
            window.google.accounts.id.disableAutoSelect();
        }
    }

    function updateAuthUI(){
        const user = getCurrentUser();
        const authAreas = document.querySelectorAll('.auth-area');
        console.log('updateAuthUI called, user:', user, 'authAreas:', authAreas.length);

        if(!authAreas || authAreas.length === 0) return;

        authAreas.forEach(authArea => {
            const googleBtn = authArea.querySelector('#googleSignIn');
            const userProfile = authArea.querySelector('.auth-user-profile');
            const accountLink = authArea.querySelector('.account-link') || authArea.querySelector('#accountLink');
            const logoutBtn = authArea.querySelector('#logoutBtn') || authArea.querySelector('.logout-btn');
            const authAvatar = authArea.querySelector('.auth-avatar') || authArea.querySelector('#authAvatar');

            if(user){
                if(googleBtn) googleBtn.style.display = 'none';
                if(userProfile) {
                    userProfile.style.display = 'flex';
                    console.log('showing userProfile for one auth-area');
                }
                if(accountLink) accountLink.textContent = (user.name||'Account');
                if(authAvatar){
                    if(user.avatar){ 
                        authAvatar.src = user.avatar;
                        authAvatar.style.display = 'block';
                        console.log('set avatar src for auth-area:', user.avatar);
                    }else{
                        authAvatar.style.display = 'none';
                    }
                }
            }else{
                if(googleBtn) googleBtn.style.display = 'inline-block';
                if(userProfile) {
                    userProfile.style.display = 'none';
                    console.log('hiding userProfile for one auth-area');
                }
                if(authAvatar) authAvatar.style.display = 'none';
            }
        });
    }

    function handleGoogleSignIn(response){
        const token = response.credential;
        // Decode JWT token manually (basic decode without verification for demo)
        try{
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            
            const ip = window._currentIP || 'unknown';
            const user = {
                name: payload.name || payload.email.split('@')[0],
                email: payload.email,
                avatar: payload.picture || '',
                ip: ip,
                orders_pending: 0,
                orders_ready: 0,
                money_invested: 0
            };
            
            if(ip !== 'unknown'){
                registerUserForIP(ip, user);
            }else{
                setCurrentUser(user);
            }
            // Try to send welcome email when available
            try{ sendWelcomeEmail(user.email, user.name); }catch(e){}
            updateAuthUI();
        }catch(e){
            console.error('Error parsing Google token:', e);
        }
    }

    function sendWelcomeEmail(email, name){
        if(!email) return;
        try{
            const key = 'welcome_sent_' + email;
            if(localStorage.getItem(key)) return;
            const subject = encodeURIComponent('Поздравляем с регистрацией на The Awiks');
            const body = encodeURIComponent('Поздравляем с регистрацией на The Awiks' + (name? (', ' + name) : '') + '! Спасибо за регистрацию.');
            // Open user's mail client with prefilled message (best-effort from client-side)
            window.open(`mailto:${email}?subject=${subject}&body=${body}`);
            localStorage.setItem(key, '1');
        }catch(e){
            console.warn('sendWelcomeEmail failed', e);
        }
    }

    function deleteCurrentAccount(){
        const user = getCurrentUser();
        if(!user) return false;
        const ip = user.ip || window._currentIP || null;
        const users = loadUsers();
        if(ip && users[ip]){
            delete users[ip];
            saveUsers(users);
        }
        setCurrentUser(null);
        return true;
    }

    function showLoginModal(){
        // Create a beautiful login modal
        const modal = document.createElement('div');
        modal.id = 'loginModal';
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
            z-index: 10000;
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
        
        const logo = document.createElement('div');
        logo.style.cssText = 'font-size: 48px; margin-bottom: 16px;';
        logo.textContent = '🔐';
        
        const title = document.createElement('h2');
        title.textContent = 'Sign in to The Awiks';
        title.style.cssText = 'margin: 0 0 8px 0; color: #1f2937; font-size: 20px;';
        
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Enter your details to access your account';
        subtitle.style.cssText = 'margin: 0 0 24px 0; color: #6b7280; font-size: 14px;';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Full Name';
        nameInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        `;
        
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'Email address';
        emailInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        `;
        
        const avatarInput = document.createElement('input');
        avatarInput.type = 'url';
        avatarInput.placeholder = 'Avatar URL (optional)';
        avatarInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        `;
        
        const signInBtn = document.createElement('button');
        signInBtn.textContent = 'Sign In';
        signInBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 12px;
            transition: background 0.2s;
        `;
        signInBtn.onmouseover = () => signInBtn.style.background = '#4338ca';
        signInBtn.onmouseout = () => signInBtn.style.background = '#4f46e5';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cancel';
        closeBtn.style.cssText = `
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
        closeBtn.onmouseover = () => closeBtn.style.background = '#e5e7eb';
        closeBtn.onmouseout = () => closeBtn.style.background = '#f3f4f6';
        
        signInBtn.addEventListener('click', function(){
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const avatar = avatarInput.value.trim();
            
            if(!name){
                alert('Please enter your name');
                return;
            }
            if(!email){
                alert('Please enter your email');
                return;
            }
            
            const ip = window._currentIP || 'unknown';
            const user = {
                name: name,
                email: email,
                avatar: avatar,
                ip: ip,
                orders_pending: 0,
                orders_ready: 0,
                money_invested: 0
            };
            
            if(ip !== 'unknown'){
                registerUserForIP(ip, user);
            }else{
                setCurrentUser(user);
            }

            // Try to send a welcome email (opens user's mail client via mailto)
            try{ sendWelcomeEmail(user.email, user.name); }catch(e){}
            
            document.body.removeChild(modal);
            updateAuthUI();
        });
        
        closeBtn.addEventListener('click', function(){
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', function(e){
            if(e.target === modal){
                document.body.removeChild(modal);
            }
        });
        
        card.appendChild(logo);
        card.appendChild(title);
        card.appendChild(subtitle);
        card.appendChild(nameInput);
        card.appendChild(emailInput);
        card.appendChild(avatarInput);
        card.appendChild(signInBtn);
        card.appendChild(closeBtn);
        modal.appendChild(card);
        document.body.appendChild(modal);
        
        nameInput.focus();
    }

    async function initGoogleSignIn(){
        // Beautiful demo login with modal
        const googleBtn = document.getElementById('googleSignIn');
        if(googleBtn){
            googleBtn.style.cursor = 'pointer';
            googleBtn.style.padding = '10px 16px';
            googleBtn.style.backgroundColor = '#fff';
            googleBtn.style.border = '1px solid #ddd';
            googleBtn.style.borderRadius = '6px';
            googleBtn.style.fontSize = '14px';
            googleBtn.style.fontWeight = '500';
            googleBtn.style.color = '#222';
            googleBtn.style.display = 'inline-flex';
            googleBtn.style.alignItems = 'center';
            googleBtn.style.gap = '8px';
            googleBtn.style.transition = 'all 0.2s';
            googleBtn.textContent = '🔐 Sign in';
            
            googleBtn.addEventListener('mouseover', function(){
                googleBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
            googleBtn.addEventListener('mouseout', function(){
                googleBtn.style.boxShadow = 'none';
            });
            
            googleBtn.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                showLoginModal();
            });
        }
    }

    async function init(){
        const ip = await getIP();
        window._currentIP = ip;
        
        const users = loadUsers();
        if(ip && users[ip]){
            setCurrentUser(users[ip]);
        }
        updateAuthUI();

        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) logoutBtn.addEventListener('click', function(){
            logout();
        });
        
        // Synchronize with other tabs/windows via localStorage events
        window.addEventListener('storage', function(e){
            if(e.key === 'currentUser' || e.key === 'users_by_ip'){
                // currentUser or users_by_ip changed in another tab, update UI
                updateAuthUI();
            }
        });
        
        // Wait for Google script to load, then initialize
        if(window.google && window.google.accounts){
            initGoogleSignIn();
        }else{
            window.addEventListener('load', initGoogleSignIn);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
    window._auth = { getCurrentUser, setCurrentUser, loadUsers, saveUsers, logout, deleteCurrentAccount, sendWelcomeEmail };
})();
