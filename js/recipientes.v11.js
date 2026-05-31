// js/recipientes.js

window.RecipientesManager = {
    targetBeaker: null,
    solutionBeaker: null,
    targetLiquid: null,
    solutionLiquid: null,
    btnEmpty: null,
    inventory: null,
    
    // Almacena las piezas físicas que se han "derretido" aquí
    currentPieces: [],

    init() {
        this.targetBeaker = document.getElementById('beaker-target');
        this.solutionBeaker = document.getElementById('beaker-solution');
        this.targetLiquid = document.getElementById('target-liquid');
        this.solutionLiquid = document.getElementById('solution-liquid');
        this.btnEmpty = document.getElementById('btn-empty-beaker');
        this.inventory = document.getElementById('pieces-inventory');

        if (!this.targetBeaker || !this.solutionBeaker) {
            console.warn("RecipientesManager: Faltan elementos del DOM.");
            return;
        }

        if (!this._bound) {
            this.setupDragAndDrop();
            
            if (this.btnEmpty) {
                this.btnEmpty.addEventListener('click', () => this.emptyBeaker());
            }
            this._bound = true;
        }
    },

    setupDragAndDrop() {
        const zone = this.solutionBeaker;

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const draggedPiece = window._draggedPiece;
            if (draggedPiece && draggedPiece.classList.contains('frac-piece')) {
                this.addPiece(draggedPiece);
                if(window.AudioSynth) window.AudioSynth.playDrop();
            }
        });
    },

    addPiece(piece) {
        // La quitamos visualmente del DOM
        if (piece.parentNode) {
            piece.parentNode.removeChild(piece);
        }
        // La guardamos en el estado interno
        this.currentPieces.push(piece);
        this.updatePhysics();
    },

    emptyBeaker() {
        try {
            // Devolvemos todas las piezas al inventario
            this.currentPieces.forEach(piece => {
                // Restaurar estilos base
                piece.className = 'frac-piece';
                piece.style.height = '40px';
                piece.style.width = `${Math.max(40, parseFloat(piece.dataset.val) * 150)}px`;
                this.inventory.appendChild(piece);
            });
            this.currentPieces = [];
            this.updatePhysics();
            
            // Notificar a balanza que el inventario cambió
            if (window.BalanzaManager && window.BalanzaManager.updatePhysics) {
                window.BalanzaManager.updatePhysics();
            }
        } catch (e) {
            alert("Error en emptyBeaker: " + e.message + "\n\n" + e.stack);
        }
    },

    updatePhysics() {
        let totalVal = 0;
        this.currentPieces.forEach(p => {
            totalVal += parseFloat(p.dataset.val);
        });

        // Actualizamos la altura del líquido unificado
        const heightPercent = totalVal * 100;
        this.solutionLiquid.style.height = `${Math.min(100, heightPercent)}%`;
        
        // Mostrar estado de sobrecarga si supera el 100%
        if (heightPercent > 100.1) { // .1 de margen por punto flotante
            this.solutionLiquid.textContent = `¡Sobrecarga! ${Math.round(heightPercent)}%`;
            this.solutionLiquid.style.color = '#fff';
            this.solutionLiquid.style.fontWeight = 'bold';
            this.solutionLiquid.style.display = 'flex';
            this.solutionLiquid.style.alignItems = 'center';
            this.solutionLiquid.style.justifyContent = 'center';
            this.solutionLiquid.style.textShadow = '0 0 8px rgba(255, 0, 0, 0.8)';
            this.solutionBeaker.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.6)';
            this.solutionBeaker.style.borderColor = '#ff4444';
            this.solutionLiquid.style.background = 'linear-gradient(180deg, #ff4444 0%, #880000 100%)';
        } else {
            this.solutionLiquid.textContent = '';
            this.solutionBeaker.style.boxShadow = '';
            this.solutionBeaker.style.borderColor = '';
            this.solutionLiquid.style.background = '';
        }
    },

    clearAll() {
        this.currentPieces = [];
        this.targetLiquid.style.height = '0%';
        this.targetLiquid.textContent = '';
        this.solutionLiquid.style.height = '0%';
        this.solutionLiquid.textContent = '';
        this.solutionBeaker.style.boxShadow = '';
        this.solutionBeaker.style.borderColor = '';
        this.solutionLiquid.style.background = '';
    },

    setTarget(piecesArray) {
        let totalVal = 0;
        piecesArray.forEach(p => {
            totalVal += parseFloat(p.val);
        });
        
        const heightPercent = totalVal * 100;
        this.targetLiquid.style.height = `${Math.min(100, heightPercent)}%`;
        this.targetLiquid.textContent = `${Math.round(heightPercent)}%`;
    },

    triggerError() {
        this.solutionBeaker.style.borderColor = 'var(--error-color)';
        this.solutionBeaker.style.boxShadow = 'var(--neon-glow-error)';
        this.solutionLiquid.style.background = 'linear-gradient(180deg, var(--error-color) 0%, #4a0000 100%)';
        
        setTimeout(() => {
            this.solutionBeaker.style.borderColor = '';
            this.solutionBeaker.style.boxShadow = '';
            this.solutionLiquid.style.background = '';
        }, 800);
    },

    triggerSuccess() {
        this.solutionBeaker.style.borderColor = 'var(--success-color)';
        this.solutionBeaker.style.boxShadow = 'var(--neon-glow-success)';
        this.solutionLiquid.style.background = 'linear-gradient(180deg, var(--success-color) 0%, #004a00 100%)';
        
        setTimeout(() => {
            this.solutionBeaker.style.borderColor = '';
            this.solutionBeaker.style.boxShadow = '';
            this.solutionLiquid.style.background = '';
        }, 1500);
    }
};
