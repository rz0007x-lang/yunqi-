export class TempleAudio {
  constructor() {
    this.enabled = false;
    this.voices = [];
    this.zone = "gate";
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
      oscillator.connect(gain);
      gain.connect(this.master);
      gain.connect(this.reverb);
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

  transition(from, to) {
    if (!this.enabled || !this.context || from === to) return;
    if (from === "gate" && to === "courtyard") {
      this.gateCreak();
      this.footsteps(7, 0.48);
    } else if (from === "courtyard" && to === "hall") {
      this.footsteps(6, 0.42);
      window.setTimeout(() => this.ringBell(true), 1650);
    } else if (from === "hall" && to === "courtyard") {
      this.footsteps(5, 0.44);
    }
  }

  gateCreak() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const pan = this.context.createStereoPanner();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(72, now);
    oscillator.frequency.exponentialRampToValueAtTime(43, now + 1.35);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(430, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 1.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.026, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
    pan.pan.value = -0.1;
    oscillator.connect(filter).connect(gain).connect(pan).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 1.5);

    const grain = this.context.createBufferSource();
    const grainFilter = this.context.createBiquadFilter();
    const grainGain = this.context.createGain();
    grain.buffer = this.noiseBuffer;
    grainFilter.type = "bandpass";
    grainFilter.frequency.value = 290;
    grainFilter.Q.value = 0.8;
    grainGain.gain.setValueAtTime(0.018, now);
    grainGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    grain.connect(grainFilter).connect(grainGain).connect(pan);
    grain.start(now, 0, 1.25);
  }

  footsteps(count = 6, spacing = 0.45) {
    if (!this.enabled || !this.context || !this.noiseBuffer) return;
    const now = this.context.currentTime + 0.16;
    for (let index = 0; index < count; index += 1) {
      const at = now + index * spacing;
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      const pan = this.context.createStereoPanner();
      source.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = 145 + (index % 3) * 26;
      filter.Q.value = 0.9;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.032, at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
      pan.pan.value = index % 2 ? 0.16 : -0.16;
      source.connect(filter).connect(gain).connect(pan).connect(this.master);
      source.start(at, (index * 0.17) % 1.4, 0.22);
    }
  }

  setZone(zone) {
    if (!["gate", "courtyard", "hall"].includes(zone)) return;
    this.zone = zone;
    if (!this.context) return;
    const now = this.context.currentTime;
    const levels = {
      gate: { wind: 0.04, water: 0.006, hall: 0.012 },
      courtyard: { wind: 0.024, water: 0.04, hall: 0.018 },
      hall: { wind: 0.006, water: 0.004, hall: 0.055 },
    }[zone];
    [[this.windGain, levels.wind], [this.waterGain, levels.water], [this.hallGain, levels.hall]].forEach(([gain, value]) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(value, now, 1.85);
    });
  }

  #createContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.context.destination);

    this.reverb = this.context.createConvolver();
    const impulse = this.context.createBuffer(2, this.context.sampleRate * 2.4, this.context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const samples = impulse.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = (Math.random() * 2 - 1) * ((1 - index / samples.length) ** 2.6);
      }
    }
    this.reverb.buffer = impulse;
    const reverbGain = this.context.createGain();
    reverbGain.gain.value = 0.12;
    this.reverb.connect(reverbGain).connect(this.master);

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
    this.hallGain = this.context.createGain();
    this.hallGain.gain.value = 0.012;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 220;
    drone.connect(droneGain);
    droneTwo.connect(droneGain);
    droneGain.connect(lowpass).connect(this.hallGain).connect(this.master);
    drone.start();
    droneTwo.start();

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    const noise = this.context.createBufferSource();
    const noiseFilter = this.context.createBiquadFilter();
    const windPan = this.context.createStereoPanner();
    this.windGain = this.context.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 620;
    noiseFilter.Q.value = 0.35;
    windPan.pan.value = -0.35;
    this.windGain.gain.value = 0.04;
    noise.connect(noiseFilter).connect(this.windGain).connect(windPan).connect(this.master);
    noise.start();

    const waterNoise = this.context.createBufferSource();
    const waterFilter = this.context.createBiquadFilter();
    const waterPan = this.context.createStereoPanner();
    this.waterGain = this.context.createGain();
    waterNoise.buffer = buffer;
    waterNoise.loop = true;
    waterFilter.type = "lowpass";
    waterFilter.frequency.value = 1050;
    waterFilter.Q.value = 0.65;
    waterPan.pan.value = 0.6;
    this.waterGain.gain.value = 0.006;
    waterNoise.connect(waterFilter).connect(this.waterGain).connect(waterPan).connect(this.master);
    waterNoise.start();
    this.setZone(this.zone);
  }
}
