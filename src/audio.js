export class TempleAudio {
  constructor() {
    this.enabled = false;
    this.voices = [];
  }

  async toggle(force) {
    const next = force ?? !this.enabled;
    if (next) await this.start();
    else this.stop();
    return this.enabled;
  }

  async start() {
    if (!this.context) this.#createContext();
    await this.context.resume();
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0.18, this.context.currentTime, 0.8);
    this.enabled = true;
  }

  stop() {
    if (!this.context) return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.35);
    this.enabled = false;
  }

  strikeWood() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(235, now);
    oscillator.frequency.exponentialRampToValueAtTime(105, now + 0.11);
    filter.type = "bandpass";
    filter.frequency.value = 430;
    filter.Q.value = 1.4;
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    oscillator.connect(filter).connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  ringBell(soft = false) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    [216, 327, 504].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime((soft ? 0.035 : 0.075) / (index + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2 + index);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 5.5 + index);
    });
  }

  bead() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = 760 + Math.random() * 60;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  #createContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.context.destination);

    const drone = this.context.createOscillator();
    const droneTwo = this.context.createOscillator();
    const droneGain = this.context.createGain();
    const lowpass = this.context.createBiquadFilter();
    drone.type = "sine";
    droneTwo.type = "sine";
    drone.frequency.value = 54;
    droneTwo.frequency.value = 81;
    drone.detune.value = -4;
    droneTwo.detune.value = 5;
    droneGain.gain.value = 0.11;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 220;
    drone.connect(droneGain);
    droneTwo.connect(droneGain);
    droneGain.connect(lowpass).connect(this.master);
    drone.start();
    droneTwo.start();

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const noise = this.context.createBufferSource();
    const noiseFilter = this.context.createBiquadFilter();
    const noiseGain = this.context.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 620;
    noiseFilter.Q.value = 0.35;
    noiseGain.gain.value = 0.018;
    noise.connect(noiseFilter).connect(noiseGain).connect(this.master);
    noise.start();
  }
}
