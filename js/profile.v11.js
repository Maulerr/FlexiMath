/**
 * Gestor del Perfil de Usuario (Local Storage)
 */
const PROFILE_KEY = 'fleximath_profile';

// Fallback en caso de que el navegador bloquee LocalStorage en archivos locales (file:///)
const safeStorage = {
    memory: {},
    get(key) {
        try { return localStorage.getItem(key); }
        catch(e) { return this.memory[key] || null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); }
        catch(e) { this.memory[key] = value; }
    },
    remove(key) {
        try { localStorage.removeItem(key); }
        catch(e) { delete this.memory[key]; }
    }
};

window.ProfileManager = {
    // Avatares temáticos: Matemáticas / Sci-Fi
    avatars: ['🧮', '📐', '🛸', '🤖', '🪐'],
    unlockThreshold: 10, // Mínimo de estrellas necesarias

    getProfile() {
        const data = safeStorage.get(PROFILE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Retrocompatibilidad: Si el perfil es de una versión anterior, le agregamos la estructura nueva
            if (!parsed.levelScores) {
                parsed.levelScores = { 1: 0, 2: 0, 3: 0 };
            }
            return parsed;
        }
        return null;
    },

    createProfile(name, avatar) {
        const newProfile = {
            name: name.trim(),
            avatar: avatar,
            stars: 0, // Total histórico
            levelScores: { 1: 0, 2: 0, 3: 0 }, // Récord de estrellas por sector
            badges: [], 
            createdAt: new Date().toISOString()
        };
        safeStorage.set(PROFILE_KEY, JSON.stringify(newProfile));
        return newProfile;
    },

    updateProfile(updatedData) {
        const current = this.getProfile();
        if (current) {
            const merged = { ...current, ...updatedData };
            safeStorage.set(PROFILE_KEY, JSON.stringify(merged));
            return merged;
        }
        return null;
    },
    
    saveLevelScore(level, score) {
        const profile = this.getProfile();
        if(!profile) return;

        // Solo guardamos si el puntaje nuevo supera el récord anterior de este nivel
        if (score > (profile.levelScores[level] || 0)) {
            profile.levelScores[level] = score;
        }
        
        // Recalcular estrellas totales sumando los récords
        profile.stars = Object.values(profile.levelScores).reduce((a, b) => a + b, 0);
        
        this.updateProfile(profile);
        this.evaluateBadges();
    },

    evaluateBadges() {
        const profile = this.getProfile();
        if (!profile) return;
        
        const newBadges = [];
        
        // Badge 1: Sector 1 completado
        if ((profile.levelScores[1] || 0) >= this.unlockThreshold) {
            newBadges.push({ id: 'badge1', icon: '🥉', title: 'Iniciado Cuántico', desc: 'Completó el Sector 1' });
        }
        // Badge 2: Sector 2 completado
        if ((profile.levelScores[2] || 0) >= this.unlockThreshold) {
            newBadges.push({ id: 'badge2', icon: '🥈', title: 'Piloto Intermedio', desc: 'Completó el Sector 2' });
        }
        // Badge 3: Sector 3 completado
        if ((profile.levelScores[3] || 0) >= this.unlockThreshold) {
            newBadges.push({ id: 'badge3', icon: '🥇', title: 'Maestro del Plasma', desc: 'Completó el Sector 3' });
        }
        
        // Badge: Licencia de Piloto
        if (profile.levelScores[0] !== undefined) {
            newBadges.push({ id: 'badge0', icon: '👨‍🚀', title: 'Licencia de Piloto', desc: 'Completó el Simulador Básico' });
        }

        // Badge 4: Perfección (15 estrellas en algún nivel)
        if (Object.values(profile.levelScores).some(score => score === 15)) {
            newBadges.push({ id: 'badge_perf', icon: '💎', title: 'Perfeccionista', desc: 'Obtuvo 15⭐ en un sector' });
        }
        
        // Badge: Crononauta Principiante
        if ((profile.levelScores[4] || 0) >= 5) {
            newBadges.push({ id: 'badge_surv1', icon: '⏳', title: 'Crononauta Principiante', desc: 'Sobrevivió 5 rondas en el Vacío' });
        }

        // Badge: Leyenda del Vacío
        if ((profile.levelScores[4] || 0) >= 15) {
            newBadges.push({ id: 'badge_surv2', icon: '🌌', title: 'Leyenda del Vacío', desc: 'Sobrevivió 15 rondas en el Vacío' });
        }
        
        const oldBadgesIds = profile.badges ? profile.badges.map(b => b.id) : [];
        
        profile.badges = newBadges;
        this.updateProfile(profile);

        // Detectar si hay insignias nuevas
        const recentlyUnlocked = newBadges.filter(b => !oldBadgesIds.includes(b.id));
        if (recentlyUnlocked.length > 0) {
            recentlyUnlocked.forEach(badge => {
                document.dispatchEvent(new CustomEvent('badgeUnlocked', { detail: badge }));
            });
        }
    },

    isLevelUnlocked(level) {
        if (level === 0 || level === 1) return true; // Nivel 0 y 1 siempre abiertos
        const profile = this.getProfile();
        if(!profile) return false;

        const previousLevelScore = profile.levelScores[level - 1] || 0;
        return previousLevelScore >= this.unlockThreshold;
    },

    clearProfile() {
        safeStorage.remove(PROFILE_KEY);
    }
};
