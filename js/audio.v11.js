/**
 * AudioSynth - Generador de SFX mediante Web Audio API
 * No requiere archivos externos, genera ondas al vuelo.
 */
window.AudioSynth = {
    ctx: null,
    
    init() {
        if (!this.ctx) {
            // Inicializar bajo demanda por políticas del navegador
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },
    
    playTone(frequency, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    
    playHover() {
        this.init();
        this.playTone(800, 'sine', 0.1, 0.05);
    },
    
    playDrop() {
        this.init();
        this.playTone(300, 'triangle', 0.15, 0.1);
    },
    
    playSuccess() {
        this.init();
        // Arpegio ascendente
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C5, E5, G5, C6
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    },
    
    playError() {
        this.init();
        // Zumbido discordante grave
        this.playTone(150, 'sawtooth', 0.4, 0.15);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.4, 0.15), 100);
    }
};
