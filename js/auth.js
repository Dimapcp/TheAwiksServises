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
        // After UI update, require password check if needed (run async, don't block)
        try{ requirePasswordCheckIfNeeded().catch(e => console.warn('Password check error', e)); }catch(e){ console.warn('Password check scheduling failed', e); }
    }
    function getCurrentUser(){
        try{return JSON.parse(localStorage.getItem('currentUser')||'null');}catch(e){return null;}
    }

    // Hash a password using SHA-256, return hex string
    async function hashPassword(password){
        if(!password) return '';
        const enc = new TextEncoder();
        const data = enc.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
    }

    function registerUserForIP(ip, data){
        const users = loadUsers();
        users[ip] = data;
        saveUsers(users);
        setCurrentUser(data);
    }

    // Blocklist helpers
    function loadBlockedIPs(){
        try{return JSON.parse(localStorage.getItem('blocked_ips')||'{}');}catch(e){return {};}
    }
    function saveBlockedIPs(obj){
        localStorage.setItem('blocked_ips', JSON.stringify(obj||{}));
    }
    function isIPBlocked(ip){
        if(!ip) return false;
        const obj = loadBlockedIPs();
        return !!obj[ip];
    }
    function blockIP(ip){
        if(!ip) return;
        const obj = loadBlockedIPs();
        obj[ip] = { blockedAt: Date.now() };
        saveBlockedIPs(obj);
    }
    function getFailedAttemptsKey(ip){ return 'failed_pw_attempts_' + (ip||'unknown'); }
    function getFailedAttempts(ip){ return parseInt(localStorage.getItem(getFailedAttemptsKey(ip))||'0',10); }
    function incFailedAttempts(ip){ const k=getFailedAttemptsKey(ip); const v=getFailedAttempts(ip)+1; localStorage.setItem(k, String(v)); return v; }
    function resetFailedAttempts(ip){ localStorage.removeItem(getFailedAttemptsKey(ip)); }

    function logout(){
        setCurrentUser(null);
        // Also sign out from Google if available
        if(window.google && window.google.accounts){
            window.google.accounts.id.disableAutoSelect();
        }
    }

    // Quick login button: allows user to type name/password to access account from any page
    function showQuickLoginPrompt(){
        const user = getCurrentUser();
        if(user){
            alert('You are already logged in as ' + (user.name||'User'));
            return;
        }
        const ip = window._currentIP || 'unknown';
        if(isIPBlocked(ip)){
            alert('This IP is blocked from signing in.');
            return;
        }
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10001;`;
        const card = document.createElement('div');
        card.style.cssText = `background:white;border-radius:12px;padding:32px;max-width:380px;width:90%;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;`;
        const title = document.createElement('h3');
        title.textContent = 'Quick Login';
        title.style.cssText = 'margin:0 0 8px 0;color:#1f2937;';
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Enter your name and password';
        subtitle.style.cssText = 'margin:0 0 16px 0;color:#6b7280;font-size:14px;';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Name';
        nameInput.style.cssText = 'width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;';
        const pwdInput = document.createElement('input');
        pwdInput.type = 'password';
        pwdInput.placeholder = 'Password';
        pwdInput.style.cssText = 'width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;';
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.style.cssText = 'width:100%;padding:10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:12px;';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'width:100%;padding:10px;background:#f3f4f6;color:#374151;border:none;border-radius:6px;cursor:pointer;margin-top:8px;';
        loginBtn.addEventListener('click', async function(){
            const name = nameInput.value.trim();
            const pwd = pwdInput.value.trim();
            if(!name || !pwd){ alert('Please enter name and password'); return; }
            const users = loadUsers();
            let foundUser = null;
            for(let key in users){ if(users[key] && users[key].name === name){ foundUser = users[key]; break; } }
            if(!foundUser){ alert('User not found'); return; }
            const h = await hashPassword(pwd);
            if(h !== foundUser.passwordHash){ alert('Incorrect password'); return; }
            setCurrentUser(foundUser);
            document.body.removeChild(modal);
            alert('Logged in successfully!');
        });
        cancelBtn.addEventListener('click', function(){
            document.body.removeChild(modal);
        });
        card.appendChild(title);
        card.appendChild(subtitle);
        card.appendChild(nameInput);
        card.appendChild(pwdInput);
        card.appendChild(loginBtn);
        card.appendChild(cancelBtn);
        modal.appendChild(card);
        document.body.appendChild(modal);
        nameInput.focus();
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
                passwordHash: '',
                passwordLastCheck: null,
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
            updateAuthUI();
        }catch(e){
            console.error('Error parsing Google token:', e);
        }
    }

    // sendWelcomeEmail removed: no automatic mailto from client-side

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

    // If current user exists and passwordLastCheck is older than 3 days, require password re-entry
    async function requirePasswordCheckIfNeeded(){
        const user = getCurrentUser();
        if(!user) return;
        const now = Date.now();
        // Production default: 3 days.
        const threeDays = 10 * 10; // 3 days
        const last = user.passwordLastCheck || 0;
        if(now - last <= threeDays) return; // still valid

        // Show modal to verify or set password
        await showPasswordPromptModal(user);
    }

    function showPasswordPromptModal(user){
        return new Promise(async (resolve)=>{
            // Add blur style to page (except modal)
            if(!document.getElementById('auth-modal-blur-style')){
                const st = document.createElement('style');
                st.id = 'auth-modal-blur-style';
                st.textContent = 'body > *:not(#passwordCheckModal){filter:blur(15px);pointer-events:none;user-select:none;} #passwordCheckModal{pointer-events:auto;}';
                document.head.appendChild(st);
            }
            const modal = document.createElement('div');
            modal.id = 'passwordCheckModal';
            modal.style.cssText = `position: fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:10002;`;
            const card = document.createElement('div');
            card.style.cssText = `background:white;border-radius:12px;padding:28px;max-width:420px;width:90%;text-align:center;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;z-index:10003;`;

            const title = document.createElement('h3');
            title.textContent = user.passwordHash? 'Password check required' : 'Set a password for your account';
            const msg = document.createElement('p');
            msg.textContent = user.passwordHash? 'For security, please re-enter your password.' : 'You do not have a password. Please set one now to secure your account.';

            const pwd = document.createElement('input');
            pwd.type = 'password';
            pwd.placeholder = 'Password';
            pwd.style.cssText = 'width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;';

            const pwd2 = document.createElement('input');
            pwd2.type = 'password';
            pwd2.placeholder = 'Confirm password';
            pwd2.style.cssText = 'width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;display:none;';

            const btn = document.createElement('button');
            btn.textContent = user.passwordHash? 'Verify' : 'Set Password';
            btn.style.cssText = 'width:100%;padding:10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:8px;';

            if(!user.passwordHash){ pwd2.style.display = 'block'; }

            btn.addEventListener('click', async function(){
                const val = pwd.value.trim();
                if(!val || val.length < 6){ alert('Password must be at least 6 characters'); return; }
                if(!user.passwordHash){ // set new password
                    if(pwd2.value.trim() !== val){ alert('Passwords do not match'); return; }
                    const h = await hashPassword(val);
                    user.passwordHash = h;
                    user.passwordLastCheck = Date.now();
                    setCurrentUser(user);
                    resetFailedAttempts(user.ip || window._currentIP);
                    if(document.head.querySelector('#auth-modal-blur-style')) document.head.removeChild(document.head.querySelector('#auth-modal-blur-style'));
                    document.body.removeChild(modal);
                    resolve(true);
                }else{ // verify
                    const h = await hashPassword(val);
                    if(h === user.passwordHash){
                        user.passwordLastCheck = Date.now();
                        setCurrentUser(user);
                        resetFailedAttempts(user.ip || window._currentIP);
                        if(document.head.querySelector('#auth-modal-blur-style')) document.head.removeChild(document.head.querySelector('#auth-modal-blur-style'));
                        document.body.removeChild(modal);
                        resolve(true);
                    }else{
                        const ip = user.ip || window._currentIP || 'unknown';
                        const attempts = incFailedAttempts(ip);
                        if(attempts >= 3){
                            // block IP and logout
                            blockIP(ip);
                            resetFailedAttempts(ip);
                            if(window._auth && window._auth.logout) window._auth.logout();
                            if(document.head.querySelector('#auth-modal-blur-style')) document.head.removeChild(document.head.querySelector('#auth-modal-blur-style'));
                            document.body.removeChild(modal);
                            alert('Too many incorrect attempts. You have been logged out and this IP is blocked.');
                            resolve(false);
                        }else{
                            alert('Incorrect password. Attempts: '+attempts+' of 3');
                        }
                    }
                }
            });

            card.appendChild(title);
            card.appendChild(msg);
            card.appendChild(pwd);
            card.appendChild(pwd2);
            card.appendChild(btn);
            modal.appendChild(card);
            document.body.appendChild(modal);
            pwd.focus();
        });
    }

    function showLoginModal(){
        // Prevent sign-in when IP is blocked
        const ipNow = window._currentIP || 'unknown';
        if(isIPBlocked(ipNow)){
            alert('This IP is blocked from signing in. Contact support.');
            return;
        }
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

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Password (min 6 chars)';
        passwordInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        `;

        const passwordConfirm = document.createElement('input');
        passwordConfirm.type = 'password';
        passwordConfirm.placeholder = 'Confirm password';
        passwordConfirm.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        `;
        
        // avatar URL removed from modal — users can upload avatar later in account page
        
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
        
        signInBtn.addEventListener('click', async function(){
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const pwd = passwordInput.value || '';
            const pwd2 = passwordConfirm.value || '';

            if(!name){ alert('Please enter your name'); return; }
            if(!email){ alert('Please enter your email'); return; }
            if(!pwd || pwd.length < 6){ alert('Password must be at least 6 characters'); return; }
            if(pwd !== pwd2){ alert('Passwords do not match'); return; }

            const ip = window._currentIP || 'unknown';
            const hashed = await hashPassword(pwd);
            const user = {
                name: name,
                email: email,
                avatar: '',
                passwordHash: hashed,
                passwordLastCheck: Date.now(),
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
        card.appendChild(passwordInput);
        card.appendChild(passwordConfirm);
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
                try{ requirePasswordCheckIfNeeded(); }catch(err){ console.warn('password check on storage failed', err); }
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
    window._auth = { getCurrentUser, setCurrentUser, loadUsers, saveUsers, logout, deleteCurrentAccount, showQuickLoginPrompt };
})();
