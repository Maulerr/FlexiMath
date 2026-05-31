/**
 * Lógica Física y Visual de la Balanza Cuántica
 */

window.BalanzaManager = {
    arm: null,
    leftPlate: null,
    rightPlate: null,
    plateContainers: null,
    inventory: null,

    // Definición de colores por formato para evitar que la equivalencia sea evidente
    colors: {
        fraction: '#3B82F6', // Fracciones (Azul)
        percentage: '#10B981', // Porcentajes (Verde)
        decimal: '#8B5CF6',  // Decimales (Morado)
        integer: '#F59E0B'   // Enteros (Naranja)
    },

    init() {
        this.arm = document.getElementById('balance-arm');
        this.leftPlate = document.getElementById('plate-target');
        this.rightPlate = document.getElementById('plate-solution');
        this.plateContainers = document.querySelectorAll('.plate-container');
        this.inventory = document.getElementById('pieces-inventory');
        
        if (!this._bound) {
            this.setupDragAndDrop();
            this._bound = true;
        }
    },

    /**
     * Crea un elemento HTML de pieza fraccionaria.
     */
    createPiece(value, label, draggable = true) {
        const piece = document.createElement('div');
        piece.className = 'frac-piece';
        piece.textContent = label;
        piece.dataset.val = value;
        
        // Estilo visual según valor
        const width = Math.max(40, value * 150); // Mínimo 40px, máx 150px
        piece.style.width = `${width}px`;
        
        // Asignar color por formato de la etiqueta (no por su valor matemático)
        let color = this.colors.integer; // Entero por defecto
        if (label.includes('/')) {
            color = this.colors.fraction;
        } else if (label.includes('%')) {
            color = this.colors.percentage;
        } else if (label.includes('.')) {
            color = this.colors.decimal;
        }
        piece.style.backgroundColor = color;

        if (draggable) {
            piece.draggable = true;
            piece.addEventListener('dragstart', (e) => {
                piece.classList.add('dragging');
                e.dataTransfer.setData('text/plain', piece.dataset.val); // Fallback
                // Guardamos referencia al elemento que se está arrastrando en window para acceso rápido
                window._draggedPiece = piece; 
            });
            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
                window._draggedPiece = null;
                this.updatePhysics();
            });
        }

        return piece;
    },

    setupDragAndDrop() {
        const dropzones = [this.rightPlate, this.inventory];

        dropzones.forEach(zone => {
            zone.addEventListener('dragover', e => {
                e.preventDefault(); // Permitir drop
                if(zone === this.rightPlate) {
                    zone.classList.add('drag-over');
                }
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const draggedPiece = window._draggedPiece;
                if (draggedPiece) {
                    if (zone === this.inventory) {
                        // Resetear estilos en caso de venir de un recipiente
                        draggedPiece.className = 'frac-piece';
                        draggedPiece.style.height = '40px';
                        draggedPiece.style.width = `${Math.max(40, parseFloat(draggedPiece.dataset.val) * 150)}px`;
                    }
                    zone.appendChild(draggedPiece);
                    this.updatePhysics();
                    // Alerta al motor de recipientes por si sacaron la pieza de ahí
                    if (window.RecipientesManager && window.RecipientesManager.updatePhysics) {
                        window.RecipientesManager.updatePhysics();
                    }
                    if(window.AudioSynth) window.AudioSynth.playDrop();
                }
            });
        });
    },

    /**
     * Limpia los platillos y el inventario.
     */
    clearAll() {
        this.leftPlate.innerHTML = '';
        this.rightPlate.innerHTML = '';
        this.inventory.innerHTML = '';
        this.updatePhysics();
    },

    /**
     * Coloca el problema fijo en el platillo izquierdo.
     */
    setTarget(piecesArray) {
        piecesArray.forEach(p => {
            const el = this.createPiece(p.val, p.label, false);
            this.leftPlate.appendChild(el);
        });
        this.updatePhysics();
    },

    /**
     * Llena el inventario inferior con piezas disponibles para resolver el problema.
     */
    setInventory(piecesArray) {
        piecesArray.forEach(p => {
            const el = this.createPiece(p.val, p.label, true);
            this.inventory.appendChild(el);
        });
    },

    /**
     * Calcula pesos y rota la balanza.
     */
    updatePhysics() {
        if(!this.arm) return;

        let leftWeight = 0;
        Array.from(this.leftPlate.children).forEach(p => {
            leftWeight += parseFloat(p.dataset.val);
        });

        let rightWeight = 0;
        Array.from(this.rightPlate.children).forEach(p => {
            rightWeight += parseFloat(p.dataset.val);
        });

        // Calculamos la diferencia
        const diff = leftWeight - rightWeight;
        
        // Multiplicador visual (cuántos grados por cada unidad de diferencia)
        // Por ejemplo, si difiere en 0.5, rota 10 grados. Max rotación +- 25deg.
        let rotation = diff * 30; 
        
        if (rotation > 25) rotation = 25;
        if (rotation < -25) rotation = -25;

        // Tolerancia a pequeños errores de punto flotante
        if (Math.abs(diff) < 0.001) rotation = 0;

        // Rotar el brazo
        this.arm.style.transform = `rotate(${-rotation}deg)`;

        // Contrarrotar los platillos para que sigan verticales
        this.plateContainers.forEach(container => {
            // El contenedor padre traslada, su hijo interno (cuerda+platillo) debe rotar opuesto
            container.style.transform = `translateX(${container.classList.contains('left') ? '-50%' : '50%'}) rotate(${rotation}deg)`;
        });
    },

    /**
     * Verifica si la balanza está equilibrada
     */
    isBalanced() {
        let leftWeight = 0;
        Array.from(this.leftPlate.children).forEach(p => leftWeight += parseFloat(p.dataset.val));

        let rightWeight = 0;
        Array.from(this.rightPlate.children).forEach(p => rightWeight += parseFloat(p.dataset.val));

        // Tolerancia
        return Math.abs(leftWeight - rightWeight) < 0.001;
    },

    triggerError() {
        this.arm.classList.add('error');
        setTimeout(() => this.arm.classList.remove('error'), 500);
    },

    triggerSuccess() {
        this.arm.classList.add('success');
        setTimeout(() => this.arm.classList.remove('success'), 1500);
    }
};
