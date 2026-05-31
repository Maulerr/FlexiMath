/**
 * Motor de Juego (Niveles, Subniveles, y Progreso)
 */

window.GameEngine = {
    currentLevel: 1,
    currentSublevel: 1,
    totalSublevels: 5,
    starsInCurrent: 3,
    totalLevelStars: 0,
    
    // Banco Dinámico de Ejercicios por Nivel
    exercisePool: {
        0: [
            { 
                target: [{val: 0.5, label: '1/2'}], 
                inventory: [{val: 0.5, label: '50%'}],
                message: "Piloto, bienvenido al simulador. Arrastra la pieza de '50%' al platillo derecho de la balanza para equilibrarla con '1/2'. ¡Son la misma cantidad!"
            },
            { 
                target: [{val: 1, label: '100%'}], 
                inventory: [{val: 0.5, label: '1/2'}, {val: 0.5, label: '0.5'}],
                message: "¡Bien hecho! Ahora cambia a la herramienta 'Recipientes de Plasma'. Llena el tanque al 100% depositando las dos piezas que equivalen a la mitad."
            }
        ]
    },
    
    currentPool: [], // Almacenará los ejercicios del nivel actual

    generatePiece(val, allowedFormats = ['frac', 'pct', 'dec']) {
        const format = allowedFormats[Math.floor(Math.random() * allowedFormats.length)];
        let label = '';
        
        const approx = (v) => Math.abs(val - v) < 0.01;
        
        if (format === 'frac') {
            if (approx(0.25)) label = '1/4';
            else if (approx(0.5)) label = '1/2';
            else if (approx(0.75)) label = '3/4';
            else if (approx(0.2)) label = '1/5';
            else if (approx(0.4)) label = '2/5';
            else if (approx(0.6)) label = '3/5';
            else if (approx(0.8)) label = '4/5';
            else if (approx(0.333)) label = '1/3';
            else if (approx(0.666)) label = '2/3';
            else if (approx(1.0)) label = '1';
            else if (approx(1.25)) label = '5/4';
            else if (approx(1.5)) label = '3/2';
            else if (approx(2.0)) label = '2';
            else if (approx(1.333)) label = '4/3';
            else label = val.toFixed(2);
        } else if (format === 'pct') {
            label = Math.round(val * 100) + '%';
        } else {
            label = val.toFixed(2).replace(/\.00$/, '');
        }
        
        return { val, label };
    },

    generateLevelExercises(level, count = 5) {
        if (level === 0) return this.exercisePool[0];
        
        const exercises = [];
        const baseValuesLevel1 = [0.25, 0.5];
        const baseValuesLevel2 = [0.2, 0.25, 0.333, 0.4, 0.5];
        
        const loreMessages = {
            1: "Piloto, bienvenido al espacio de trabajo real. El reactor de curvatura necesita calibraciones precisas usando mitades y cuartos de energía. ¡No te equivoques!",
            2: "Entramos en zona de turbulencia cuántica. Los motores ahora operan con tercios y quintos. La precisión es vital.",
            3: "¡Alerta! Necesitamos prepararnos para el salto hiperespacial. Tendrás que sobrecargar los recipientes superando el 100% de su capacidad. Usa fracciones impropias."
        };

        for (let i = 0; i < count; i++) {
            let correctPiecesCount = (Math.random() > 0.5) ? 2 : 3;
            let availableValues = [];
            
            if (level === 1) availableValues = baseValuesLevel1;
            else if (level === 2) availableValues = baseValuesLevel2;
            else if (level === 3) availableValues = [0.25, 0.5, 0.333, 1.0];
            
            let correctVals = [];
            let targetVal = 0;
            for (let p = 0; p < correctPiecesCount; p++) {
                let v = availableValues[Math.floor(Math.random() * availableValues.length)];
                correctVals.push(v);
                targetVal += v;
            }
            
            let totalInventorySize = Math.floor(Math.random() * 2) + 4; // 4 o 5
            let inventoryVals = [...correctVals];
            while (inventoryVals.length < totalInventorySize) {
                inventoryVals.push(availableValues[Math.floor(Math.random() * availableValues.length)]);
            }
            
            let targetLabel = this.generatePiece(targetVal, ['frac', 'pct', 'dec']).label;
            let targetObj = [{ val: targetVal, label: targetLabel }];
            
            this.shuffleArray(inventoryVals);
            let inventoryObj = inventoryVals.map(v => this.generatePiece(v));
            
            let exercise = { target: targetObj, inventory: inventoryObj };
            
            if (i === 0 && loreMessages[level]) {
                exercise.message = loreMessages[level];
            }
            
            exercises.push(exercise);
        }
        
        return exercises;
    },

    init() {
        this.activityTitle = document.getElementById('activity-title');
        this.activityProgress = document.getElementById('activity-progress');
        this.currentStarsEl = document.getElementById('current-stars');
        this.totalLevelStarsEl = document.getElementById('total-level-stars');
        this.survivalTimerEl = document.getElementById('survival-timer');
        
        this.btnSubmit = document.getElementById('btn-submit-answer');
        this.btnNext = document.getElementById('btn-next-exercise');
        
        this.inventory = document.getElementById('pieces-inventory');

        this.feedbackModal = document.getElementById('feedback-modal');
        this.feedbackMessage = document.getElementById('feedback-message');
        this.btnCloseFeedback = document.getElementById('btn-close-feedback');

        window.BalanzaManager.init();
        window.RecipientesManager.init();

        if(!this._bound) {
            this.btnSubmit.addEventListener('click', () => this.verifyAnswer());
            this.btnNext.addEventListener('click', () => this.nextSublevel());
            
            if (this.btnCloseFeedback) {
                this.btnCloseFeedback.addEventListener('click', () => {
                    this.feedbackModal.style.display = 'none';
                });
            }
            
            this._bound = true;
        }
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    startLevel(level) {
        this.currentLevel = level;
        this.currentSublevel = 0; // Ajustado para usar array index
        this.totalLevelStars = 0;
        this.isSurvival = (level === 4);
        
        if (this.isSurvival) {
            this.timeLeft = 60;
            this.totalSublevels = '∞';
            this.currentPool = [];
            if(this.timerInterval) clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                this.updateUI();
                if(this.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    this.finishSurvival();
                }
            }, 1000);
        } else {
            if(this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.currentPool = this.generateLevelExercises(level, 5);
            this.totalSublevels = this.currentPool.length;
        }
        
        this.init();
        this.renderExercise();
    },

    renderExercise() {
        if (this.isSurvival) {
            let rLevel = Math.floor(Math.random() * 3) + 1; // 1, 2, o 3
            this.currentExercise = this.generateLevelExercises(rLevel, 1)[0];
            this.currentExercise.message = null; // Sin lore en supervivencia
        } else {
            // Asegurar que exista
            if(!this.currentPool || !this.currentPool[this.currentSublevel]) {
                console.error('No exercise found for sublevel ' + this.currentSublevel);
                return;
            }
            this.currentExercise = this.currentPool[this.currentSublevel];
        }

        const exercise = this.currentExercise;
        this.starsInCurrent = 3; // Reset attempt energy
        
        window.BalanzaManager.clearAll();
        window.RecipientesManager.clearAll();
        
        this.inventory.innerHTML = '';

        // El target se setea en ambas herramientas para que al alternar ya estén listas
        window.BalanzaManager.setTarget(exercise.target);
        window.RecipientesManager.setTarget(exercise.target);
        
        // El inventario ahora es global, usamos uno de los managers para poblarlo
        window.BalanzaManager.setInventory(exercise.inventory);
        
        this.btnSubmit.style.display = 'block';
        this.btnNext.style.display = 'none';
        
        const balanzaArm = document.getElementById('balance-arm');
        if(balanzaArm) {
            balanzaArm.classList.remove('success', 'error');
        }
        
        // Commander Message
        const commanderPanel = document.getElementById('commander-panel');
        const commanderText = document.getElementById('commander-text');
        if (exercise.message && commanderPanel && commanderText) {
            commanderText.textContent = exercise.message;
            commanderPanel.style.display = 'flex';
        } else if (commanderPanel) {
            commanderPanel.style.display = 'none';
        }
        
        // Renderizar intento actual (estrellas disponibles)
        this.currentStarsEl.innerHTML = `Energía Intento: ${'⭐'.repeat(this.starsInCurrent)}`;
    },

    updateUI() {
        this.activityProgress.textContent = `Simulación: ${this.currentSublevel + 1} / ${this.totalSublevels}`;
        
        if (this.isSurvival) {
            this.currentStarsEl.style.display = 'none';
            this.totalLevelStarsEl.style.display = 'block';
            this.totalLevelStarsEl.textContent = `Récord Actual: ${this.totalLevelStars}`;
            if(this.survivalTimerEl) {
                this.survivalTimerEl.style.display = 'block';
                this.survivalTimerEl.textContent = `⏳ ${this.timeLeft}s`;
                if (this.timeLeft <= 10) this.survivalTimerEl.style.color = 'var(--error-color)';
                else this.survivalTimerEl.style.color = 'var(--accent-color)';
            }
        } else {
            this.currentStarsEl.style.display = 'block';
            this.totalLevelStarsEl.style.display = 'block';
            if(this.survivalTimerEl) this.survivalTimerEl.style.display = 'none';
            
            if (this.currentLevel === 0) {
                this.totalLevelStarsEl.textContent = `Acumulado: ${this.totalLevelStars} ⭐`;
            } else {
                this.totalLevelStarsEl.textContent = `Acumulado: ${this.totalLevelStars}/15 ⭐`;
            }
            
            let starsStr = '';
            for(let i = 0; i < this.starsInCurrent; i++) starsStr += '⭐';
            for(let i = this.starsInCurrent; i < 3; i++) starsStr += '❌';
            this.currentStarsEl.textContent = `Energía Intento: ${starsStr}`;
        }
    },

    verifyAnswer() {
        const exercise = this.currentExercise;
        let targetWeight = 0;
        exercise.target.forEach(p => targetWeight += parseFloat(p.val));

        let solutionWeight = 0;
        
        // Leer las piezas desde la herramienta que esté activa actualmente
        const activeTool = document.querySelector('.tool-view.active').id;
        
        if (activeTool === 'tool-balanza') {
            Array.from(window.BalanzaManager.rightPlate.children).forEach(p => {
                solutionWeight += parseFloat(p.dataset.val);
            });
        } else if (activeTool === 'tool-recipientes') {
            window.RecipientesManager.currentPieces.forEach(p => {
                solutionWeight += parseFloat(p.dataset.val);
            });
        }

        const isCorrect = Math.abs(targetWeight - solutionWeight) < 0.002;

        if(isCorrect) {
            // ¡Éxito!
            if(window.AudioSynth) window.AudioSynth.playSuccess();
            window.BalanzaManager.triggerSuccess();
            window.RecipientesManager.triggerSuccess();
            
            if (this.isSurvival) {
                this.timeLeft += 5; // Recompensa
                this.totalLevelStars++; // Rondas ganadas
                this.updateUI();
                this.btnSubmit.style.display = 'none';
                setTimeout(() => this.nextSublevel(), 1000); // Auto avanzar
            } else {
                this.totalLevelStars += this.starsInCurrent;
                this.btnSubmit.style.display = 'none';
                this.btnNext.style.display = 'block';
            }
        } else {
            // Error
            if(window.AudioSynth) window.AudioSynth.playError();
            window.BalanzaManager.triggerError();
            window.RecipientesManager.triggerError();
            
            if (this.currentLevel !== 0) {
                this.starsInCurrent--;
            }
            
            // Calcular diferencia y mostrar modal
            let diff = Math.abs(targetWeight - solutionWeight);
            let targetStr = targetWeight.toFixed(2);
            let solutionStr = solutionWeight.toFixed(2);
            let diffStr = diff.toFixed(2);
            
            let feedbackText = `¡Desequilibrio detectado! El núcleo requería <strong>${targetStr}</strong>, pero insertaste <strong>${solutionStr}</strong>.<br><br>`;
            if (solutionWeight > targetWeight) {
                feedbackText += `Te has pasado por <strong>${diffStr}</strong>.`;
            } else {
                feedbackText += `Te ha faltado <strong>${diffStr}</strong>.`;
            }
            
            if (this.feedbackModal && this.feedbackMessage) {
                this.feedbackMessage.innerHTML = feedbackText;
                this.feedbackModal.style.display = 'flex';
            }
            
            if (this.starsInCurrent <= 0 && this.currentLevel !== 0) {
                this.starsInCurrent = 0;
                this.updateUI();
                alert('¡Sistema desequilibrado crítico! Avanzando a la siguiente simulación de emergencia.');
                this.btnSubmit.style.display = 'none';
                this.btnNext.style.display = 'block';
            } else {
                this.updateUI();
            }
        }
    },

    nextSublevel() {
        try {
            if (this.isSurvival) {
                this.currentSublevel++;
                this.renderExercise();
            } else {
                if (this.currentSublevel < this.totalSublevels - 1) {
                    this.currentSublevel++;
                    this.renderExercise();
                } else {
                    this.finishLevel();
                }
            }
        } catch (e) {
            alert("Error en nextSublevel: " + e.message + "\n\n" + e.stack);
        }
    },
    
    finishSurvival() {
        window.ProfileManager.saveLevelScore(4, this.totalLevelStars);
        alert(`¡Tiempo Agotado! Sobreviviste ${this.totalLevelStars} rondas en el Vacío Cuántico.`);
        document.dispatchEvent(new CustomEvent('returnToMap'));
    },

    finishLevel() {
        // Guardar progreso en el perfil
        window.ProfileManager.saveLevelScore(this.currentLevel, this.totalLevelStars);
        
        // Mensaje de fin
        if (this.currentLevel === 0) {
            alert(`¡Entrenamiento completado! Ya estás listo para tu primera misión en el laboratorio.`);
        } else {
            const threshold = window.ProfileManager.unlockThreshold;
            if (this.totalLevelStars >= threshold) {
                alert(`¡Sector ${this.currentLevel} completado con éxito! Recolectaste ${this.totalLevelStars}⭐ de energía. Sector siguiente desbloqueado.`);
            } else {
                alert(`Sector completado. Recolectaste ${this.totalLevelStars}⭐. Necesitas ${threshold}⭐ para desbloquear el siguiente sector. ¡Inténtalo de nuevo!`);
            }
        }

        // Volver al mapa recargando el dashboard
        // Disparamos un evento custom o llamamos al render del app.js
        document.dispatchEvent(new CustomEvent('returnToMap'));
    }
};
