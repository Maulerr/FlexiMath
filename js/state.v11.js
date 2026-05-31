/**
 * Motor Matemático Central (Central State Manager)
 */

class MathState {
    constructor() {
        this.currentValueDecimal = 0; 
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.currentValueDecimal));
    }

    setValue(decimalValue) {
        this.currentValueDecimal = decimalValue;
        this.notify();
    }
    
    getFraction() {
        return { numerator: 0, denominator: 1 };
    }
    
    getPercentage() {
        return this.currentValueDecimal * 100;
    }
}

// Lo asignamos a window para que funcione sin módulos ES6 en local
window.mathState = new MathState();
