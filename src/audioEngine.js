import * as Tone from 'tone';

// Synthesized locally: no sample downloads or third-party audio requests.
const PRESETS = {
  piano: {
    voice: 'fm', level: -7,
    options: {
      harmonicity: 1, modulationIndex: 2.4,
      oscillator: { type: 'sine' }, modulation: { type: 'sine' },
      envelope: { attack: 0.003, decay: 1.5, sustain: 0.06, release: 0.8 },
      modulationEnvelope: { attack: 0.001, decay: 0.38, sustain: 0.015, release: 0.35 },
    },
  },
  epiano: {
    voice: 'fm', level: -8,
    options: {
      harmonicity: 2, modulationIndex: 2.8,
      oscillator: { type: 'sine' }, modulation: { type: 'sine' },
      envelope: { attack: 0.004, decay: 1.7, sustain: 0.09, release: 1.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.55, sustain: 0.08, release: 0.7 },
    },
  },
  organ: {
    level: -16,
    options: {
      oscillator: { type: 'custom', partials: [1, 0.35, 0.5, 0.12, 0.2, 0.06, 0.1] },
      envelope: { attack: 0.012, decay: 0.08, sustain: 0.8, release: 0.17 },
    },
  },
  strings: {
    level: -18,
    options: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 13 },
      envelope: { attack: 0.22, decay: 0.3, sustain: 0.65, release: 1.4 },
    },
  },
  flute: {
    level: -15,
    options: {
      oscillator: { type: 'custom', partials: [1, 0.035, 0.12, 0.015, 0.025] },
      envelope: { attack: 0.055, decay: 0.18, sustain: 0.72, release: 0.35 },
    },
  },
  bells: {
    voice: 'fm', level: -10,
    options: {
      harmonicity: 3.5, modulationIndex: 4.5,
      oscillator: { type: 'sine' }, modulation: { type: 'sine' },
      envelope: { attack: 0.002, decay: 2.4, sustain: 0, release: 1.8 },
      modulationEnvelope: { attack: 0.001, decay: 1.1, sustain: 0, release: 1.3 },
    },
  },
};

const clamp = (value, fallback = 0) => Number.isFinite(Number(value))
  ? Math.min(1, Math.max(0, Number(value))) : fallback;

// Final safety clipper: identity up to the knee (~-1.4 dBFS), then a tanh shoulder that approaches
// but never reaches full scale. A WaveShaper only reads inputs in [-1, 1], so the signal is scaled
// down by SAFETY_HEADROOM before it and the curve scales it back up.
const SAFETY_KNEE = 0.85;
const SAFETY_CEILING = 0.99;
const SAFETY_HEADROOM = 4;
function softClip(v) {
  const a = Math.abs(v);
  if (a <= SAFETY_KNEE) return v;
  const range = SAFETY_CEILING - SAFETY_KNEE;
  return Math.sign(v) * (SAFETY_KNEE + range * Math.tanh((a - SAFETY_KNEE) / range));
}

export function createAudioEngine({ volume = 0.85, reverb = 0.24, brightness = 0.65, instrument = 'piano' } = {}) {
  const highpass = new Tone.Filter({ type: 'highpass', frequency: 45, rolloff: -12 });
  const toneFilter = new Tone.Filter({ type: 'lowpass', frequency: 1200 + clamp(brightness) ** 2 * 11800, Q: 0.35, rolloff: -12 });
  const room = new Tone.Reverb({ decay: 2.2, preDelay: 0.012, wet: clamp(reverb) * 0.65 });
  const compressor = new Tone.Compressor({ threshold: -18, ratio: 3, knee: 12, attack: 0.008, release: 0.2 });
  // Makeup gain after the compressor brings the instrument up to a healthy level.
  const makeup = new Tone.Gain(Tone.dbToGain(6));
  const master = new Tone.Gain(clamp(volume));
  // Tone's Limiter is a fast compressor, not a brickwall: dense chords can still overshoot it,
  // so the soft clipper after it guarantees the output never hard-clips.
  const limiter = new Tone.Limiter(-1);
  const safetyIn = new Tone.Gain(1 / SAFETY_HEADROOM);
  const safety = new Tone.WaveShaper(x => softClip(x * SAFETY_HEADROOM), 8192).toDestination();
  safety.oversample = '4x';
  const waveform = new Tone.Waveform(1024);
  // 2048 bins ≈ 11 Hz each, fine enough to separate the low notes on a log-frequency display.
  const fft = new Tone.FFT({ size: 2048, smoothing: 0.78 });
  highpass.chain(toneFilter, room, compressor, makeup, master, limiter, safetyIn, safety);
  safety.connect(waveform);
  safety.connect(fft);

  let disposed = false;
  let pedalDown = false;
  let currentInstrument = PRESETS[instrument] ? instrument : 'piano';
  const held = new Set();
  const sustained = new Set();
  const voices = new Set();
  const retiredTimers = new Set();

  function makeVoice(id, offset = 0) {
    const preset = PRESETS[id] || PRESETS.piano;
    const voice = new Tone.PolySynth(preset.voice === 'fm' ? Tone.FMSynth : Tone.Synth, preset.options);
    voice.maxPolyphony = 32;
    voice.volume.value = preset.level + offset;
    voice.connect(highpass);
    voices.add(voice);
    return voice;
  }

  let local = makeVoice(currentInstrument);

  // Keep this facade stable so demos, the composer and held-key callbacks all
  // address the current voice after an instrument change.
  const synth = {
    triggerAttack(note, time, velocity = 0.78) {
      if (disposed) return;
      if (held.has(note) || sustained.has(note)) local.triggerRelease(note, time);
      sustained.delete(note);
      held.add(note);
      local.triggerAttack(note, time, Math.max(0.025, clamp(velocity, 0.78)));
    },
    triggerRelease(note, time) {
      if (disposed) return;
      held.delete(note);
      if (pedalDown) sustained.add(note);
      else local.triggerRelease(note, time);
    },
    triggerAttackRelease(note, duration, time, velocity = 0.72) {
      if (!disposed) local.triggerAttackRelease(note, duration, time, Math.max(0.025, clamp(velocity, 0.72)));
    },
    releaseAll(time) {
      held.clear();
      sustained.clear();
      if (!disposed) local.releaseAll(time);
    },
  };

  return {
    synth,
    ready: room.ready,
    analyser: { waveform, fft },
    setVolume(value) { if (!disposed) master.gain.rampTo(clamp(value), 0.05); },
    setReverb(value) { if (!disposed) room.wet.rampTo(clamp(value) * 0.65, 0.1); },
    setBrightness(value) { if (!disposed) toneFilter.frequency.rampTo(1200 + clamp(value) ** 2 * 11800, 0.1); },
    setSustain(enabled) {
      pedalDown = Boolean(enabled);
      if (!pedalDown && !disposed) {
        for (const note of sustained) if (!held.has(note)) local.triggerRelease(note);
        sustained.clear();
      }
    },
    setInstrument(id) {
      if (disposed || !PRESETS[id] || currentInstrument === id) return;
      const previous = local;
      synth.releaseAll();
      local = makeVoice(id);
      currentInstrument = id;
      // Let the old release finish instead of cutting the waveform mid-cycle.
      const timer = setTimeout(() => {
        previous.dispose();
        voices.delete(previous);
        retiredTimers.delete(timer);
      }, 3200);
      retiredTimers.add(timer);
    },
    createRemoteVoice() {
      if (disposed) return null;
      const voice = makeVoice('piano', -3);
      return {
        triggerAttack(note) { voice.triggerAttack(note, undefined, 0.72); },
        triggerRelease(note) { voice.triggerRelease(note); },
        releaseAll() { voice.releaseAll(); },
        dispose() { if (voices.delete(voice)) voice.dispose(); },
      };
    },
    getAudioFrame() {
      if (disposed) return null;
      const samples = waveform.getValue();
      let energy = 0;
      let peak = 0;
      for (const sample of samples) {
        energy += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
      return { waveform: samples, fft: fft.getValue(), sampleRate: fft.context.sampleRate, level: Math.sqrt(energy / samples.length), peak };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      retiredTimers.forEach(clearTimeout);
      voices.forEach(voice => voice.dispose());
      voices.clear();
      held.clear();
      sustained.clear();
      [highpass, toneFilter, room, compressor, makeup, master, limiter, safetyIn, safety, waveform, fft].forEach(node => node.dispose());
    },
  };
}
