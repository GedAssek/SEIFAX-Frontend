/**
 * LEFAXEUR Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuthGuard();
    updateNavigation();
    initMobileMenu();
    
    const loginView = document.getElementById('login-view');
    if (loginView) {
        initAuthPage();
    }
});

// Guard: Rediriger si non connecté et tente d'accéder à une page privée
function checkAuthGuard() {
    const stored = JSON.parse(localStorage.getItem('LEFAXEUR_user'));
    const currentPath = window.location.pathname;
    
    const isIndex = currentPath.endsWith('/') || currentPath.endsWith('index.html');
    const isLogin = currentPath.includes('login.html');

    if (!stored || !stored.access_token) {
        // L'utilisateur n'est pas connecté
        if (!isIndex && !isLogin) {
            // Il essaie d'accéder à Epreuves, Infos ou Admin
            // => On le renvoie de force vers login
            const depth = currentPath.includes('pages/') ? '' : 'pages/';
            window.location.href = depth + 'login.html';
        }
    } else {
        // L'utilisateur EST connecté, s'il est sur la page login, on le renvoie à l'accueil
        if (isLogin) {
            window.location.href = '../index.html';
        }
    }
}

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const isDark = localStorage.getItem('theme') === 'dark';
    
    if (isDark) {
        document.body.classList.add('dark');
        if(toggleBtn) toggleBtn.textContent = '☀️';
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
            toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        });
    }
}

function updateNavigation() {
    const stored = JSON.parse(localStorage.getItem('LEFAXEUR_user'));
    const user = stored?.user || null;
    
    // Éléments UI
    const authLink = document.getElementById('nav-auth');
    const logoutBtn = document.getElementById('nav-logout');
    const adminLink = document.getElementById('nav-admin');
    const userBadge = document.getElementById('user-badge');
    const authNavLinks = document.getElementById('auth-nav-links');
    
    // Sections Index
    const welcomeGuest = document.getElementById('welcome-guest');
    const dashboardUser = document.getElementById('dashboard-user');
    const dashboardName = document.getElementById('dashboard-name');

    if (user) {
        // CONNECTÉ
        if (authLink) authLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (authNavLinks) authNavLinks.style.display = 'flex';
        
        if (userBadge) {
            userBadge.style.display = 'inline-block';
            userBadge.style.cursor = 'pointer';
            userBadge.title = 'Mon Profil';
            userBadge.textContent = user.prenom || user.name || 'Étudiant';
            if (user.role === 'admin') {
                userBadge.classList.add('admin-badge');
                userBadge.textContent += ' (Admin)';
            }
            
            // Add Profile Modal if not exists
            if (!document.getElementById('profile-modal')) {
                const modalHtml = `
                <div id="profile-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
                    <div class="card animate-fade-in" style="width:100%; max-width:420px; margin:20px; position:relative;">
                        <button id="close-profile-modal" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text);">&times;</button>
                        <h2 style="margin-bottom:1rem; font-size:1.25rem;">👤 Mon Profil</h2>
                        <div style="margin-bottom:1rem; display:flex; flex-direction:column; gap:0.4rem;">
                            <p><strong>Nom:</strong> ${user.prenom} ${user.nom}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Rôle:</strong> ${user.role}</p>
                            <p><strong>Cycle:</strong> ${user.cycle || 'N/A'}</p>
                            <p><strong>Année d'étude:</strong> ${user.annee || 'N/A'}</p>
                            <p><strong>Sexe:</strong> ${user.sexe || 'N/A'}</p>
                            <p><strong>Promotion:</strong> ${user.promotion || 'N/A'}</p>
                        </div>
                        <hr style="margin: 1rem 0; border:0; border-top:1px solid rgba(128,128,128,0.2);">
                        <h3 style="font-size:1rem; margin-bottom:1rem;">🔒 Changer le mot de passe</h3>
                        <form id="form-change-password">
                            <div class="form-group">
                                <label class="form-label">Ancien mot de passe</label>
                                <div style="position:relative;">
                                    <input type="password" class="form-control" id="old-password" required style="padding-right:2.5rem;">
                                    <button type="button" id="toggle-old-pwd" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1.1rem; color:var(--text-muted);">👁️</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nouveau mot de passe</label>
                                <div style="position:relative;">
                                    <input type="password" class="form-control" id="new-password" required style="padding-right:2.5rem;">
                                    <button type="button" id="toggle-new-pwd" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1.1rem; color:var(--text-muted);">👁️</button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">Mettre à jour</button>
                        </form>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                const profileModal = document.getElementById('profile-modal');
                const closeBtn = document.getElementById('close-profile-modal');
                const pwdForm = document.getElementById('form-change-password');
                
                // Toggle password visibility
                document.getElementById('toggle-old-pwd').addEventListener('click', () => {
                    const inp = document.getElementById('old-password');
                    inp.type = inp.type === 'password' ? 'text' : 'password';
                });
                document.getElementById('toggle-new-pwd').addEventListener('click', () => {
                    const inp = document.getElementById('new-password');
                    inp.type = inp.type === 'password' ? 'text' : 'password';
                });
                
                userBadge.addEventListener('click', () => profileModal.style.display = 'flex');
                closeBtn.addEventListener('click', () => profileModal.style.display = 'none');
                profileModal.addEventListener('click', (e) => {
                    if(e.target === profileModal) profileModal.style.display = 'none';
                });
                
                pwdForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const oldP = document.getElementById('old-password').value;
                    const newP = document.getElementById('new-password').value;
                    try {
                        const res = await api.updatePassword(oldP, newP);
                        alert(res.message);
                        pwdForm.reset();
                        profileModal.style.display = 'none';
                    } catch(err) {
                        alert(err.message);
                    }
                });
            }
        }
        
        if (adminLink) {
            adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
        }
        
        // Sur index.html : Afficher le dashboard, cacher l'accueil public
        if (welcomeGuest) welcomeGuest.classList.add('hidden');
        if (dashboardUser) {
            dashboardUser.classList.remove('hidden');
            if (dashboardName) dashboardName.textContent = user.prenom || user.name || 'Étudiant';
        }
        
        // HEARTBEAT : signale au serveur que l'utilisateur est en ligne
        api.sendHeartbeat(); // appel immédiat
        setInterval(() => api.sendHeartbeat(), 2 * 60 * 1000); // puis toutes les 2 minutes
        
    } else {
        // NON CONNECTÉ
        if (authLink) authLink.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (authNavLinks) authNavLinks.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (userBadge) userBadge.style.display = 'none';
        
        // Sur index.html : Afficher l'accueil public
        if (welcomeGuest) welcomeGuest.classList.remove('hidden');
        if (dashboardUser) dashboardUser.classList.add('hidden');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('LEFAXEUR_user');
            // Redirige vers la racine (index.html) peu importe où on est
            const depth = window.location.pathname.includes('pages/') ? '../' : '';
            window.location.href = depth + 'index.html';
        });
    }
}

function initAuthPage() {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const btnToRegister = document.getElementById('btn-to-register');
    const btnToLogin = document.getElementById('btn-to-login');
    
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const cycleSelect = document.getElementById('reg-cycle');
    const studyYearSelect = document.getElementById('reg-annee');

    function showCompleteProfileMode(detail, currentPassword) {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
        registerView.classList.add('animate-fade-in');
        
        registerView.querySelector('h2').textContent = "Compléter mon profil";
        registerView.querySelector('p').textContent = "Veuillez mettre à jour vos informations pour continuer.";
        
        registerForm.dataset.mode = 'complete-profile';
        
        if (registerForm.nom && detail.nom) {
            registerForm.nom.value = detail.nom;
            registerForm.nom.readOnly = true;
        }
        if (registerForm.prenom && detail.prenom) {
            registerForm.prenom.value = detail.prenom;
            registerForm.prenom.readOnly = true;
        }
        if (registerForm.email && detail.email) {
            registerForm.email.value = detail.email;
            registerForm.email.readOnly = true;
        }
        
        const cycleGroup = document.getElementById('reg-cycle-annee-group');
        if (cycleGroup) cycleGroup.style.display = 'none';
        
        if (registerForm.cycle) registerForm.cycle.removeAttribute('required');
        if (registerForm.annee) registerForm.annee.removeAttribute('required');
        
        const btn = registerForm.querySelector('button[type="submit"]');
        btn.textContent = "Mettre à jour mon profil";
        btn.dataset.defaultLabel = "Mettre à jour mon profil";
        
        const toggleP = registerView.querySelector('.auth-toggle');
        if (toggleP) toggleP.style.display = 'none';
    }

    function setSubmitLoading(button, label, isLoading) {
        button.disabled = isLoading;
        button.classList.toggle('is-loading', isLoading);
        button.innerHTML = isLoading
            ? `<span class="button-content"><span class="button-spinner" aria-hidden="true"></span>${label}</span>`
            : `<span class="button-content">${button.dataset.defaultLabel}</span>`;
    }

    function updateStudyYearOptions() {
        if (!cycleSelect || !studyYearSelect) return;
        const cycle = cycleSelect.value;
        const isTechnicianCycle = cycle.startsWith('T-');
        const yearCount = cycle.startsWith('IEAMAC-') ? 3 : (cycle.startsWith('EAC-') || cycle === 'CCA') ? 2 : 1;
        studyYearSelect.innerHTML = '<option value="">Choisir...</option>';
        for (let year = 1; year <= yearCount; year += 1) {
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = `${year}${year === 1 ? 'ère' : 'ème'} année`;
            studyYearSelect.appendChild(option);
        }
        // La formation technicien dure une année : sélectionner et verrouiller ce choix.
        if (isTechnicianCycle) studyYearSelect.value = '1';
        studyYearSelect.disabled = !cycle || isTechnicianCycle;
    }

    if (cycleSelect && studyYearSelect) {
        cycleSelect.addEventListener('change', updateStudyYearOptions);
        updateStudyYearOptions();
    }

    ['reg-password', 'reg-password-confirm'].forEach((inputId) => {
        const input = document.getElementById(inputId);
        if (!input || input.parentElement.classList.contains('input-icon-wrap')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'input-icon-wrap';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'eye-toggle';
        button.innerHTML = '&#128065;';
        button.setAttribute('aria-label', 'Afficher le mot de passe');
        button.title = 'Afficher le mot de passe';
        button.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            button.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
            button.title = button.getAttribute('aria-label');
        });
        wrapper.appendChild(button);
    });

    // Vérifier si l'URL contient #register pour afficher directement la vue d'inscription
    if (window.location.hash === '#register') {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
        registerView.classList.add('animate-fade-in');
    }

    if (btnToRegister) {
        btnToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginView.classList.add('hidden');
            registerView.classList.remove('hidden');
            registerView.classList.add('animate-fade-in');
        });
    }

    if (btnToLogin) {
        btnToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');
            loginView.classList.add('animate-fade-in');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const btn = loginForm.querySelector('button[type="submit"]');
            
            btn.dataset.defaultLabel = btn.textContent.trim();
            setSubmitLoading(btn, 'Connexion en cours', true);

            try {
                const res = await api.login(email, password);
                // Stocker le token ET les infos utilisateur ensemble
                localStorage.setItem('LEFAXEUR_user', JSON.stringify(res));
                window.location.href = '../index.html';
            } catch (err) {
                if (err.detail && err.detail.code === 'profile_completion_required') {
                    showCompleteProfileMode(err.detail, password);
                } else {
                    alert(err.message);
                }
                setSubmitLoading(btn, '', false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            
            const password = registerForm.password.value;
            const passwordConfirm = registerForm.password_confirm.value;
            
            if (password !== passwordConfirm) {
                alert('Les mots de passe ne correspondent pas.');
                return;
            }

            btn.dataset.defaultLabel = btn.textContent.trim();
            setSubmitLoading(btn, registerForm.dataset.mode === 'complete-profile' ? 'Mise à jour en cours' : 'Création en cours', true);
            
            if (registerForm.dataset.mode === 'complete-profile') {
                const profileData = {
                    username: registerForm.email.value,
                    password: password,
                    sexe: registerForm.sexe.value,
                    promotion: registerForm.promotion.value
                };
                
                try {
                    const res = await api.completeProfile(profileData);
                    alert("Profil mis à jour avec succès ! Connexion en cours...");
                    const loginRes = await api.login(profileData.username, profileData.password);
                    localStorage.setItem('LEFAXEUR_user', JSON.stringify(loginRes));
                    window.location.href = '../index.html';
                } catch (err) {
                    alert(err.message || "Erreur lors de la mise à jour");
                    setSubmitLoading(btn, '', false);
                }
                return;
            }
            
            const userData = {
                username: registerForm.email.value,
                nom: registerForm.nom.value,
                prenom: registerForm.prenom.value,
                cycle: registerForm.cycle.value,
                annee: registerForm.annee.value,
                email: registerForm.email.value,
                password: password,
                sexe: registerForm.sexe.value,
                promotion: registerForm.promotion.value
            };

            try {
                const res = await api.register(userData);
                if (res.message) {
                    alert('Inscription reussie ! Connectez-vous maintenant avec votre email et mot de passe.');
                    registerView.classList.add('hidden');
                    loginView.classList.remove('hidden');
                    if (loginForm.email) loginForm.email.value = userData.email;
                }
            } catch (err) {
                alert(err.message);
            } finally {
                setSubmitLoading(btn, '', false);
            }
        });
    }
}

/**
 * ─── Mobile Hamburger Menu ────────────────────────────────────────────────
 * Injecte et pilote le menu latéral mobile (drawer)
 */
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu   = document.getElementById('mobile-menu');
    const overlay      = document.getElementById('mobile-nav-overlay');
    const closeBtn     = document.getElementById('mobile-menu-close');

    if (!hamburgerBtn || !mobileMenu) return;

    function openMenu() {
        mobileMenu.classList.add('open');
        overlay && overlay.classList.add('open');
        hamburgerBtn.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('open');
        overlay && overlay.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Fermer sur clic d'un lien dans le menu
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Fermer si l'écran devient grand (resize)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMenu();
    });
}
