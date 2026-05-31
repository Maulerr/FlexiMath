/**
 * Motor Matemático Central (Central State Manager)
 * Centraliza la lógica de equivalencias para mantener la sincronía entre
 * la representación discreta (balanzas) y la representación continua (recipientes).
 */

class MathState {
    constructor() {
        // La fuente de la verdad para el estado de la app en esta sesión.
        this.currentValueDecimal = 0;

        // Podes de observadores suscritos a cambios de estado
        this.listeners = [];
    }

    /**
     * Suscribe un componente visual o lógico a los cambios de estado.
     * @param {Function} listener Función callback a ejecutar.
     */
    subscribe(listener) {
        this.listeners.push(listener);
    }

    /**
     * Notifica a todos los oyentes de un cambio en el estado.
     */
    notify() {
        this.listeners.forEach(listener => listener(this.currentValueDecimal));
    }

    /**
     * Actualiza el valor decimal (fuente de verdad) y notifica a las vistas.
     * @param {number} decimalValue El nuevo valor.
     */
    setValue(decimalValue) {
        this.currentValueDecimal = decimalValue;
        this.notify();
    }

    /**
     * (Placeholder) Obtendrá una fracción simplificada o equivalente a partir del decimal.
     */
    getFraction() {
        // Todo: Lógica de simplificación y cálculo de fracciones
        return { numerator: 0, denominator: 1 };
    }

    /**
     * (Placeholder) Obtendrá el valor porcentual a partir del decimal.
     */
    getPercentage() {
        return this.currentValueDecimal * 100;
    }
    /**
     * Parsea un string que puede ser fracción, decimal o porcentaje
     * y retorna su valor decimal. Retorna NaN si no es válido.
     * @param {string} input Valor a parsear.
     * @returns {number} Valor numérico decimal.
     */
    parseValue(input) {
        if (!input && input !== 0) return NaN;

        // Convertimos a string, eliminamos espacios y cambiamos coma por punto
        const str = input.toString().trim().replace(',', '.');

        // Es porcentaje? (ej. "25%")
        if (str.endsWith('%')) {
            const num = parseFloat(str.replace('%', ''));
            return num / 100;
        }

        // Es fracción? (ej. "1/4")
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 2) {
                const num = parseFloat(parts[0]);
                const den = parseFloat(parts[1]);
                if (den !== 0) return num / den;
            }
        }

        // Si es decimal o número entero normal
        return parseFloat(str);
    }

    /**
     * Verifica si dos entradas son matemáticamente equivalentes.
     * Soporta márgenes de error de punto flotante.
     * @param {string} inputA Primera entrada (ej. "1/4")
     * @param {string} inputB Segunda entrada (ej. "25%")
     * @returns {boolean} True si son matemáticamente equivalentes.
     */
    checkEquivalence(inputA, inputB) {
        const valA = this.parseValue(inputA);
        const valB = this.parseValue(inputB);

        if (isNaN(valA) || isNaN(valB)) return false;

        // Tolerancia Educativa: Margen de 2 decimales (0.01)
        // Esto permite que fracciones como 100/6 toleren respuestas como "16.66" o "16.67"
        return Math.abs(valA - valB) <= 0.01;
    }
}

// Exportamos una única instancia (Singleton) para coordinar las vistas.
export const mathState = new MathState();
