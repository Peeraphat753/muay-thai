// Procedural sound generator using Web Audio API to avoid external asset dependencies
class SoundFXEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Ring Gong Bell (Round Start/End)
  playGong() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now); // Bell frequency
    osc1.frequency.exponentialRampToValueAtTime(110, now + 1.5);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(445, now);
    osc2.frequency.exponentialRampToValueAtTime(112, now + 1.2);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  }

  // Normal Punch Hit Hit sound
  playPunchHit() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Buffer source for noise explosion
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter noise for impact low punch boom
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(10, now + 0.1);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.15);

    // Add metallic synth hit
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Energy burst skill O sound
  playBurst() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.setValueAtTime(400, now);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Kicking sweep sound
  playKick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gainNode.gain.setValueAtTime(0.45, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Victory Theme Fanfare
  playVictory() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C chord

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.15 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.5);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.6);
    });
  }

  // Defeat low groan sound
  playDefeat() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(45, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }
}

export const sfx = new SoundFXEngine();
