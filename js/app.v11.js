// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    try {
        const mainNav = document.getElementById('main-nav');
        const headerSubtitle = document.getElementById('header-subtitle');
        const views = document.querySelectorAll('.view-section');

        const viewRegistro = document.getElementById('view-registro');
        const inputName = document.getElementById('input-name');
        const avatarContainer = document.getElementById('avatar-container');
        const btnStart = document.getElementById('btn-start');

        const displayName = document.getElementById('display-name');
        const displayAvatar = document.getElementById('display-avatar');
        const displayStars = document.getElementById('display-stars');
        const btnLogout = document.getElementById('btn-logout');

        const viewActividad = document.getElementById('view-actividad');
        const btnBackMap = document.getElementById('btn-back-map');
        const toolBtns = document.querySelectorAll('.tool-btn');
        const toolViews = document.querySelectorAll('.tool-view');
        
        const levelMapContainer = document.getElementById('level-map-container');

        let selectedAvatar = null;

        // Sonidos UI globales
        document.body.addEventListener('mouseenter', (e) => {
            if (e.target && (e.target.tagName === 'BUTTON' || (e.target.classList && e.target.classList.contains('level-card')) || (e.target.classList && e.target.classList.contains('avatar-option')))) {
                if(window.AudioSynth) window.AudioSynth.playHover();
            }
        }, true);

        // Escuchar evento custom de Engine para volver al mapa

    document.addEventListener('returnToMap', () => {
        loadApp(window.ProfileManager.getProfile()); // Recargar mapa con nuevos datos
    });

    document.addEventListener('badgeUnlocked', (e) => {
        const badge = e.detail;
        const toast = document.getElementById('achievement-toast');
        const iconEl = document.getElementById('toast-icon');
        const descEl = document.getElementById('toast-desc');
        
        if(toast && iconEl && descEl) {
            iconEl.textContent = badge.icon;
            descEl.textContent = badge.title;
            
            if(window.AudioSynth) window.AudioSynth.playSuccess(); // Sonido épico
            
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    });

    function init() {
        const profile = window.ProfileManager.getProfile();
        if (profile) {
            loadApp(profile);
        } else {
            showView('view-registro');
            renderAvatarSelection();
        }
    }

    function renderAvatarSelection() {
        avatarContainer.innerHTML = '';
        window.ProfileManager.avatars.forEach(avatar => {
            const div = document.createElement('div');
            div.className = 'avatar-option';
            div.textContent = avatar;
            div.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedAvatar = avatar;
                validateForm();
            });
            avatarContainer.appendChild(div);
        });
    }

    function validateForm() {
        if (inputName.value.trim().length > 0 && selectedAvatar) {
            btnStart.disabled = false;
        } else {
            btnStart.disabled = true;
        }
    }

    inputName.addEventListener('input', validateForm);

    btnStart.addEventListener('click', () => {
        const name = inputName.value.trim();
        if (name && selectedAvatar) {
            const profile = window.ProfileManager.createProfile(name, selectedAvatar);
            loadApp(profile);
        }
    });

    function loadApp(profile) {
        // Render Profile Info
        displayName.textContent = profile.name;
        displayAvatar.textContent = profile.avatar;
        displayStars.textContent = profile.stars;
        headerSubtitle.textContent = `Piloto: ${profile.name}`;

        // Render Dynamic Level Map
        renderLevelMap(profile);
        
        // Render Badges
        renderBadges();

        mainNav.style.display = 'flex';
        showView('view-mapa');
    }
    
    function renderLevelMap(profile) {
        levelMapContainer.innerHTML = '';
        
        const levelsData = [
            { id: 0, title: 'Sector 0: Entrenamiento', desc: 'Simulador Básico (Opcional)' },
            { id: 1, title: 'Sector 1: Básicos', desc: 'Medios y Cuartos' },
            { id: 2, title: 'Sector 2: Intermedio', desc: 'Tercios y Quintos' },
            { id: 3, title: 'Sector 3: Avanzado', desc: 'Fracciones Impropias' },
            { id: 4, title: 'Sector X: Supervivencia', desc: 'Contrarreloj Infinito' }
        ];

        levelsData.forEach(lvl => {
            const isUnlocked = window.ProfileManager.isLevelUnlocked(lvl.id);
            const score = profile.levelScores[lvl.id] || 0;
            let scoreText = '';
            if (isUnlocked) {
                if (lvl.id === 0) scoreText = `Mejor: ${score} ⭐`;
                else if (lvl.id === 4) scoreText = `Récord: ${score} rondas`;
                else scoreText = `Mejor: ${score}/15 ⭐`;
            }
            
            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            card.innerHTML = `
                <div class="level-icon">${isUnlocked ? lvl.id : '🔒'}</div>
                <div class="level-info">
                    <h3>${lvl.title}</h3>
                    <p>${lvl.desc}</p>
                    ${isUnlocked ? `<small style="color:var(--accent-color)">${scoreText}</small>` : ''}
                </div>
                ${isUnlocked ? `<button class="btn-play" data-level="${lvl.id}">Cargar Nivel</button>` : ''}
            `;
            
            levelMapContainer.appendChild(card);
        });
        
        // Re-bind play buttons
        levelMapContainer.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const levelId = parseInt(btn.dataset.level);
                mainNav.style.display = 'none';
                showView('view-actividad');
                switchTool('balanza');
                
                // INICIAR MOTOR
                window.GameEngine.startLevel(levelId);
            });
        });
    }

    function renderBadges() {
        window.ProfileManager.evaluateBadges();
        const profile = window.ProfileManager.getProfile();
        const container = document.querySelector('.badges-container');
        
        if (!profile.badges || profile.badges.length === 0) {
            container.innerHTML = '<div class="badge-empty"><p>Completa sectores para ganar insignias.</p></div>';
            return;
        }
        
        container.innerHTML = '';
        profile.badges.forEach(badge => {
            const el = document.createElement('div');
            el.className = 'badge-item';
            el.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <h4>${badge.title}</h4>
                    <p>${badge.desc}</p>
                </div>
            `;
            container.appendChild(el);
        });
    }

    btnLogout.addEventListener('click', () => {
        if(confirm('¿Confirmas purgar el núcleo de memoria? Se perderá el progreso local.')) {
            window.ProfileManager.clearProfile();
            location.reload();
        }
    });

    const navButtons = document.querySelectorAll('#main-nav .nav-btn[data-view]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.view;
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showView(`view-${target}`);
        });
    });

    btnBackMap.addEventListener('click', () => {
        if(confirm('¿Estás seguro de abortar la misión? Perderás el progreso de esta ronda.')) {
            loadApp(window.ProfileManager.getProfile());
        }
    });

    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const oldTool = document.querySelector('.tool-btn.active').dataset.tool;
            const newTool = btn.dataset.tool;
            
            if (oldTool === newTool) return;

            // Mover las piezas de la zona de solución activa a la nueva
            const balanzaPlate = window.BalanzaManager.rightPlate;
            const recipientesBeaker = window.RecipientesManager.solutionBeaker;
            
            if (oldTool === 'balanza' && newTool === 'recipientes') {
                // Pasar de balanza a recipientes
                const pieces = Array.from(balanzaPlate.children);
                pieces.forEach(p => {
                    window.RecipientesManager.addPiece(p);
                });
                window.BalanzaManager.updatePhysics();
            } 
            else if (oldTool === 'recipientes' && newTool === 'balanza') {
                // Pasar de recipientes a balanza
                const pieces = [...window.RecipientesManager.currentPieces];
                pieces.forEach(p => {
                    p.className = 'frac-piece';
                    p.style.height = '40px';
                    p.style.width = `${Math.max(40, parseFloat(p.dataset.val) * 150)}px`;
                    balanzaPlate.appendChild(p);
                });
                // Limpiar el recipiente internamente
                window.RecipientesManager.currentPieces = [];
                window.RecipientesManager.updatePhysics();
                window.BalanzaManager.updatePhysics();
            }

            toolBtns.forEach(b => b.classList.remove('active'));
            toolViews.forEach(v => v.classList.remove('active'));
            toolViews.forEach(v => v.style.display = 'none');
            
            btn.classList.add('active');
            const targetView = document.getElementById('tool-' + newTool);
            targetView.classList.add('active');
            targetView.style.display = 'flex';
        });
    });

    function switchTool(toolId) {
        toolBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.tool-btn[data-tool="${toolId}"]`).classList.add('active');

        toolViews.forEach(view => {
            if (view.id === `tool-${toolId}`) {
                view.style.display = 'flex';
                view.classList.add('active');
            } else {
                view.style.display = 'none';
                view.classList.remove('active');
            }
        });
    }

    function showView(viewId) {
        views.forEach(view => {
            if (view.id === viewId) {
                view.style.display = 'flex';
                view.style.animation = 'none';
                view.offsetHeight;
                view.style.animation = null;
            } else {
                view.style.display = 'none';
            }
        });
    }

        init();
    } catch(err) {
        alert("ERROR EN APP.JS:\n" + err.message + "\n\nStack:\n" + err.stack);
    }
});
