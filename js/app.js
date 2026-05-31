import { mathState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.app-nav .nav-btn');
    const views = document.querySelectorAll('.view-section');

    // Manejo de Navegación
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetViewId = `view-${btn.dataset.view}`;

            // Actualizar estado visual de los botones
            navButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Actualizar visibilidad de las vistas
            views.forEach(view => {
                if (view.id === targetViewId) {
                    view.style.display = 'flex';
                    // Reiniciar animación para feedback de transición
                    view.style.animation = 'none';
                    view.offsetHeight; // Forzar reflow
                    view.style.animation = '';
                } else {
                    view.style.display = 'none';
                }
            });
        });
    });

    // Logging inicial para confirmar estado
    console.log("🚀 FlexiMath: Inicializado correctamente (Fase 1 & Fase 2)");
    console.log("🧠 Motor Matemático (Estado Centralizado):", mathState);

    // ==========================================
    // FASE 6: Selector de Dificultad y Progresión
    // ==========================================
    const balanceBeam = document.getElementById('balance-beam');
    const dropZone = document.getElementById('drop-zone');
    const balanceStatus = document.getElementById('balance-status');
    const weightsGrid = document.getElementById('weights-grid');
    const leftPlateTarget = document.getElementById('left-plate-target');
    
    // Elementos Fase 6
    const difficultySelect = document.getElementById('difficulty');
    const playerScoreEl = document.getElementById('player-score');
    const btnNext = document.getElementById('btn-next');
    
    let currentScore = 0;
    let isLevelComplete = false;
    
    // Base de datos pedagógica
    const BASIC_LEVEL = [
        { val: 0.5, strings: ['1/2', '0.5', '50%'] },
        { val: 0.25, strings: ['1/4', '0.25', '25%'] },
        { val: 0.75, strings: ['3/4', '0.75', '75%'] },
        { val: 0.2, strings: ['1/5', '0.2', '20%'] },
        { val: 0.4, strings: ['2/5', '0.4', '40%'] },
        { val: 0.6, strings: ['3/5', '0.6', '60%'] },
        { val: 0.8, strings: ['4/5', '0.8', '80%'] },
        { val: 0.1, strings: ['1/10', '0.1', '10%'] },
        { val: 0.3, strings: ['3/10', '0.3', '30%'] },
        { val: 0.7, strings: ['7/10', '0.7', '70%'] },
        { val: 0.9, strings: ['9/10', '0.9', '90%'] }
    ];

    const ADVANCED_LEVEL = [
        ...BASIC_LEVEL,
        { val: 1/3, strings: ['1/3', '33.3%', '0.33'] },
        { val: 2/3, strings: ['2/3', '66.6%', '0.67'] },
        { val: 0.125, strings: ['1/8', '0.125', '12.5%'] },
        { val: 0.375, strings: ['3/8', '0.375', '37.5%'] },
        { val: 0.625, strings: ['5/8', '0.625', '62.5%'] },
        { val: 0.875, strings: ['7/8', '0.875', '87.5%'] },
        { val: 1.5, strings: ['3/2', '1.5', '150%'] },
        { val: 1.25, strings: ['5/4', '1.25', '125%'] }
    ];

    let currentTargetVal = 0;
    
    function getActivePool() {
        return difficultySelect && difficultySelect.value === 'advanced' ? ADVANCED_LEVEL : BASIC_LEVEL;
    }

    function getFormattedString(val, pool) {
        const known = pool.find(item => Math.abs(item.val - val) <= 0.01);
        if (known) {
            return known.strings[Math.floor(Math.random() * known.strings.length)];
        }
        return Math.random() > 0.5 ? `${Math.round(val * 100)}%` : (Math.round(val * 100)/100).toString();
    }

    function generarReto() {
        if (!leftPlateTarget || !weightsGrid) return;
        
        isLevelComplete = false;
        if (btnNext) btnNext.style.display = 'none';
        
        const activePool = getActivePool();
        
        // 1. Elegir valor objetivo
        const targetObj = activePool[Math.floor(Math.random() * activePool.length)];
        currentTargetVal = targetObj.val;
        const targetString = targetObj.strings[Math.floor(Math.random() * targetObj.strings.length)];
        
        // Mostrar objetivo en pantalla con Diseño Dinámico
        leftPlateTarget.innerHTML = '';
        leftPlateTarget.dataset.val = targetString;
        
        // Evitar que el gráfico rompa el layout visual en fracciones impropias al rellenar a > 360deg
        // Limitamos el gradiante visual a 360 para el plato, aunque el numero represente más.
        if (targetString.includes('/')) {
            const deg = Math.min(currentTargetVal * 360, 360);
            const container = document.createElement('div');
            container.className = 'fraction-pie-container';
            
            const pie = document.createElement('div');
            pie.className = 'fraction-pie';
            pie.style.background = `conic-gradient(#3b82f6 0deg, #3b82f6 ${deg}deg, #e5e7eb ${deg}deg, #e5e7eb 360deg)`;
            
            const label = document.createElement('div');
            label.className = 'fraction-label';
            label.textContent = targetString;
            
            container.appendChild(pie);
            container.appendChild(label);
            leftPlateTarget.appendChild(container);
        } else {
            const screen = document.createElement('div');
            screen.className = 'digital-screen';
            screen.textContent = targetString;
            leftPlateTarget.appendChild(screen);
        }
        
        // 2. Limpiar áreas
        weightsGrid.innerHTML = '';
        dropZone.innerHTML = '';
        dropZone.classList.remove('success');
        
        // 3. Generar set de pesas mágicamente
        let generatedWeights = [];
        
        // Vía A: Victoria de un solo bloque (Distinto formato)
        let singleBlockStr = getFormattedString(currentTargetVal, activePool);
        let failsafe = 0;
        while (singleBlockStr === targetString && failsafe < 20) {
            singleBlockStr = getFormattedString(currentTargetVal, activePool);
            failsafe++;
        }
        generatedWeights.push(singleBlockStr);
        
        // Vía B: Victoria con suma de bloques
        let candidates = activePool.filter(item => item.val < currentTargetVal - 0.01);
        if (candidates.length === 0) {
            let half = currentTargetVal / 2;
            generatedWeights.push(getFormattedString(half, activePool));
            generatedWeights.push(getFormattedString(half, activePool));
        } else {
            let pieceA = candidates[Math.floor(Math.random() * candidates.length)].val;
            let pieceB = currentTargetVal - pieceA;
            generatedWeights.push(getFormattedString(pieceA, activePool));
            generatedWeights.push(getFormattedString(pieceB, activePool));
        }
        
        // Complementar con distractores seguros
        let availableDistractors = activePool.filter(item => Math.abs(item.val - currentTargetVal) > 0.01);
        while (generatedWeights.length < 6) {
            let distractorInfo = availableDistractors[Math.floor(Math.random() * availableDistractors.length)];
            generatedWeights.push(getFormattedString(distractorInfo.val, activePool));
        }
        
        // Mezclar aleatoriamente
        generatedWeights.sort(() => Math.random() - 0.5);
        
        // Crear elementos DOM
        generatedWeights.forEach(strVal => {
            const el = document.createElement('div');
            el.className = 'weight-item draggable';
            el.draggable = true;
            el.dataset.val = strVal;
            el.textContent = strVal;
            
            el.addEventListener('dragstart', () => { if(!isLevelComplete) el.classList.add('dragging'); });
            el.addEventListener('dragend', () => { 
                el.classList.remove('dragging');
                if(!isLevelComplete) evaluateBalance(); 
            });
            
            weightsGrid.appendChild(el);
        });
        
        evaluateBalance();
    }

    // Configurar Drop Zones
    if (dropZone && weightsGrid) {
        dropZone.addEventListener('dragover', e => { 
            if(isLevelComplete) return;
            e.preventDefault(); 
            dropZone.classList.add('drag-over'); 
        });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', e => {
            if(isLevelComplete) return;
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const draggingElement = document.querySelector('.dragging');
            if (draggingElement) dropZone.appendChild(draggingElement);
        });

        weightsGrid.addEventListener('dragover', e => { 
            if(!isLevelComplete) e.preventDefault(); 
        });
        weightsGrid.addEventListener('drop', e => {
            if(isLevelComplete) return;
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            if (draggingElement) weightsGrid.appendChild(draggingElement);
        });
    }

    // Manejo de eventos de Fase 6 (Dificultad y Siguiente)
    if (difficultySelect) {
        difficultySelect.addEventListener('change', () => {
            // Reiniciar board con nueva dificultad
            generarReto();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            generarReto();
        });
    }

    function evaluateBalance() {
        if (!dropZone || !balanceBeam || isLevelComplete) return;

        const droppedWeights = dropZone.querySelectorAll('.weight-item');
        let currentRightSum = 0;
        
        droppedWeights.forEach(weight => {
            const parsed = mathState.parseValue(weight.dataset.val);
            if (!isNaN(parsed)) currentRightSum += parsed;
        });

        const diff = currentTargetVal - currentRightSum;
        const isEquivalent = Math.abs(diff) <= 0.01;

        if (isEquivalent && currentRightSum > 0) {
            balanceBeam.style.transform = 'rotate(0deg)';
            dropZone.classList.add('success');
            balanceStatus.textContent = '¡Equilibrio logrado! 🎉';
            balanceStatus.classList.add('success');
            
            // Lógica Fase 6 (Avanzar)
            isLevelComplete = true;
            currentScore += 10;
            if(playerScoreEl) playerScoreEl.textContent = currentScore;
            
            if(btnNext) btnNext.style.display = 'block';
            
        } else {
            dropZone.classList.remove('success');
            balanceStatus.classList.remove('success');
            
            if (currentRightSum === 0) {
                balanceBeam.style.transform = 'rotate(-10deg)';
                balanceStatus.textContent = 'Agrega pesas al plato vacío...';
            } else if (currentRightSum > currentTargetVal) {
                balanceBeam.style.transform = 'rotate(10deg)';
                balanceStatus.textContent = '¡Te pasaste!';
            } else {
                balanceBeam.style.transform = 'rotate(-10deg)';
                balanceStatus.textContent = 'Aún falta peso...';
            }
        }
    }
    
    // Inicializar primer reto de Balanza
    generarReto();

    // ==========================================
    // FASE 7: Contenedores Continuos (Líquidos)
    // ==========================================
    const recipTargetLabel = document.getElementById('recip-target-label');
    const recipCurrentLabel = document.getElementById('recip-current-label');
    const recipLeftLiquid = document.getElementById('recip-left-liquid');
    const recipRightLiquid = document.getElementById('recip-right-liquid');
    const recipStatus = document.getElementById('recip-status');
    const valvesGrid = document.getElementById('valves-grid');
    const btnRecipEmpty = document.getElementById('btn-recip-empty');
    const btnRecipNext = document.getElementById('btn-recip-next');
    const recipDifficulty = document.getElementById('recip-difficulty');
    const recipPlayerScore = document.getElementById('recip-player-score');

    let rScore = 0;
    let rTargetVal = 0;
    let rCurrentSum = 0;
    let rIsComplete = false;

    // Filter to limit volume base to maximum 1.0 (100% tank height)
    function getRecipPool() {
        const base = recipDifficulty && recipDifficulty.value === 'advanced' ? ADVANCED_LEVEL : BASIC_LEVEL;
        return base.filter(item => item.val <= 1.0); 
    }

    function generarRetoRecipientes() {
        if (!recipTargetLabel || !valvesGrid) return;

        rIsComplete = false;
        rCurrentSum = 0;
        
        btnRecipNext.style.display = 'none';
        btnRecipEmpty.style.display = 'none';
        recipRightLiquid.className = 'liquid-fill liquid-dynamic';
        recipRightLiquid.style.height = '0%';
        recipCurrentLabel.textContent = 'Vacío';
        recipStatus.textContent = 'Agrega líquido usando las válvulas...';
        recipStatus.classList.remove('success');

        const activePool = getRecipPool();
        const targetObj = activePool[Math.floor(Math.random() * activePool.length)];
        rTargetVal = targetObj.val;
        const targetString = targetObj.strings[Math.floor(Math.random() * targetObj.strings.length)];

        recipTargetLabel.textContent = targetString;
        recipLeftLiquid.style.height = `${rTargetVal * 100}%`;

        valvesGrid.innerHTML = '';
        
        let generatedValves = [];
        
        // Ensure a direct fill format works
        generatedValves.push(getFormattedString(rTargetVal, activePool));
        
        // Ensure split combinations 
        let candidates = activePool.filter(item => item.val < rTargetVal - 0.01);
        if (candidates.length > 0) {
            let pieceA = candidates[Math.floor(Math.random() * candidates.length)].val;
            let pieceB = rTargetVal - pieceA;
            generatedValves.push(getFormattedString(pieceA, activePool));
            generatedValves.push(getFormattedString(pieceB, activePool));
        } else {
            let half = rTargetVal / 2;
            generatedValves.push(getFormattedString(half, activePool));
            generatedValves.push(getFormattedString(half, activePool));
        }

        let distractors = activePool.filter(item => Math.abs(item.val - rTargetVal) > 0.01);
        while (generatedValves.length < 6) {
            let d = distractors[Math.floor(Math.random() * distractors.length)];
            generatedValves.push(getFormattedString(d.val, activePool));
        }

        // Shuffle arrays randomly
        generatedValves.sort(() => Math.random() - 0.5);

        generatedValves.forEach(valStr => {
            const btn = document.createElement('button');
            btn.className = 'valve-btn';
            btn.textContent = `+ ${valStr}`;
            btn.dataset.val = valStr;
            btn.addEventListener('click', () => {
                if (rIsComplete) return;
                agregarLiquido(valStr);
            });
            valvesGrid.appendChild(btn);
        });
    }

    function agregarLiquido(strVal) {
        const val = mathState.parseValue(strVal);
        if (isNaN(val)) return;

        rCurrentSum += val;
        
        const isHoveringOverflow = rCurrentSum > 1.0;
        const boundedHeight = Math.min(rCurrentSum * 100, 100);
        
        recipRightLiquid.style.height = `${boundedHeight}%`;
        recipCurrentLabel.textContent = `${Math.round(rCurrentSum * 100)}%`;

        const diff = rTargetVal - rCurrentSum;
        const isEquivalent = Math.abs(diff) <= 0.01;

        if (isEquivalent) {
            rIsComplete = true;
            recipRightLiquid.className = 'liquid-fill liquid-dynamic success';
            recipStatus.textContent = '¡Nivel exacto logrado! 🎉';
            recipStatus.classList.add('success');
            
            rScore += 10;
            if(recipPlayerScore) recipPlayerScore.textContent = rScore;
            
            btnRecipNext.style.display = 'block';
            btnRecipEmpty.style.display = 'none';
        } else if (rCurrentSum > rTargetVal || isHoveringOverflow) {
            rIsComplete = true; // Block UI because overflow means error state
            recipRightLiquid.className = 'liquid-fill liquid-dynamic overflow';
            recipStatus.textContent = '¡Relleno excedido! Capacidad sobrepasada 🚫';
            recipStatus.classList.remove('success');
            
            btnRecipEmpty.style.display = 'block';
        } else {
            recipStatus.textContent = 'Llenando tanque...';
        }
    }

    // Handlers
    if (btnRecipNext) btnRecipNext.addEventListener('click', generarRetoRecipientes);
    
    if (btnRecipEmpty) btnRecipEmpty.addEventListener('click', () => {
        rIsComplete = false;
        rCurrentSum = 0;
        recipRightLiquid.className = 'liquid-fill liquid-dynamic';
        recipRightLiquid.style.height = '0%';
        recipCurrentLabel.textContent = '0%';
        recipStatus.textContent = 'Tanque vaciado. Inténtalo de nuevo.';
        btnRecipEmpty.style.display = 'none';
    });
    
    if (recipDifficulty) {
        recipDifficulty.addEventListener('change', () => {
            generarRetoRecipientes();
        });
    }

    // Inicializar Recipientes (esperando a su display a través de la NavBar actual)
    if (document.getElementById('view-recipientes')) {
       generarRetoRecipientes();
    }
});
