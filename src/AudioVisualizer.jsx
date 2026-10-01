import { useEffect, useRef, useState } from 'react';
import './audio-visualizer.css';

const NO_NOTES = new Set();
// Spectrum bars span 80 Hz–8 kHz on a log scale, so every octave gets the same width.
const SPECTRUM_MIN_HZ = 80;
const SPECTRUM_RANGE = 8000 / SPECTRUM_MIN_HZ;
// Quiet passages are boosted up to this factor so the waveform stays readable.
const MAX_WAVEFORM_GAIN = 10;

function formatNote(note) {
  if (typeof note === 'number') {
    const pitches = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
    return `${pitches[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;
  }
  return String(note).replaceAll('#', '♯');
}

/** Visualizes the actual output signal; getAudioFrame may return null before audio starts. */
export default function AudioVisualizer({ getAudioFrame, activeNotes = NO_NOTES, variant = 'default' }) {
  const canvasRef = useRef(null);
  const getterRef = useRef(getAudioFrame);
  const redrawRef = useRef(null);
  const [mode, setMode] = useState('waveform');
  const [reducedMotion, setReducedMotion] = useState(false);
  const noteNames = Array.from(activeNotes, formatNote);

  useEffect(() => { getterRef.current = getAudioFrame; }, [getAudioFrame]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return undefined;

    let width = 0;
    let height = 0;
    let frameId;
    let previousTime = 0;
    let disposed = false;

    const draw = () => {
      if (disposed || !width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const middle = height / 2;
      const inset = 8;
      const plotWidth = width - inset * 2;
      // A quiet, static grid is the resting state. No synthetic signal is drawn.
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(212, 176, 106, 0.06)';
      context.beginPath();
      for (let column = 0; column <= 12; column += 1) {
        const x = inset + (column / 12) * plotWidth;
        context.moveTo(x, 8);
        context.lineTo(x, height - 8);
      }
      for (let row = 1; row <= 3; row += 1) {
        const y = (row / 4) * height;
        context.moveTo(inset, y);
        context.lineTo(width - inset, y);
      }
      context.stroke();

      const audio = getterRef.current?.();
      const samples = audio?.waveform;
      let peak = 0;
      if (samples) {
        for (let index = 0; index < samples.length; index += 1) {
          peak = Math.max(peak, Math.abs(Number.isFinite(samples[index]) ? samples[index] : 0));
        }
      }

      if (mode === 'spectrum' && audio?.fft?.length && peak > 0.0002) {
        const bins = audio.fft;
        const count = Math.min(64, bins.length);
        const spacing = plotWidth / count;
        // Tone.FFT returns size bins covering 0 to Nyquist.
        const binHz = (audio.sampleRate || 44100) / (bins.length * 2);
        const binAt = (frequency) => Math.min(bins.length - 1, Math.floor(frequency / binHz));
        const gradient = context.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(201, 126, 26, 0.25)');
        gradient.addColorStop(0.5, 'rgba(212, 176, 106, 0.7)');
        gradient.addColorStop(1, '#ecd49c');
        context.fillStyle = gradient;
        for (let index = 0; index < count; index += 1) {
          const start = binAt(SPECTRUM_MIN_HZ * SPECTRUM_RANGE ** (index / count));
          const end = Math.max(start + 1, binAt(SPECTRUM_MIN_HZ * SPECTRUM_RANGE ** ((index + 1) / count)));
          let db = -100;
          for (let bin = start; bin < Math.min(end, bins.length); bin += 1) {
            db = Math.max(db, Number.isFinite(bins[bin]) ? bins[bin] : -100);
          }
          const strength = Math.max(0, Math.min(1, (db + 90) / 90));
          const barHeight = strength ** 1.4 * (height - 20);
          if (barHeight < 0.5) continue;
          const x = inset + spacing * index + 1;
          const y = height - 10 - barHeight;
          context.fillRect(x, y, Math.max(1, spacing - 3), barHeight);
          context.fillStyle = 'rgba(255, 228, 176, 0.9)';
          context.fillRect(x, y, Math.max(1, spacing - 3), 2);
          context.fillStyle = gradient;
        }
      } else if (mode === 'waveform' && samples?.length && peak > 0.0002) {
        const points = Math.min(Math.ceil(plotWidth), samples.length);
        const amplitude = (height / 2 - 12) * 0.94 * Math.min(MAX_WAVEFORM_GAIN, 0.9 / peak);
        context.beginPath();
        for (let index = 0; index < points; index += 1) {
          const sampleIndex = Math.floor((index / (points - 1)) * (samples.length - 1));
          const sample = Math.max(-1, Math.min(1, samples[sampleIndex] || 0));
          const x = inset + (index / (points - 1)) * plotWidth;
          const y = middle - sample * amplitude;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = '#d4b06a';
        context.lineWidth = 1.65;
        context.lineJoin = 'round';
        context.shadowColor = 'rgba(212, 176, 106, 0.55)';
        context.shadowBlur = 9;
        context.stroke();
        context.shadowBlur = 0;
      }

      if (mode === 'spectrum' || peak <= 0.0002) {
        const y = mode === 'spectrum' ? height - 10 : middle;
        const baseline = context.createLinearGradient(0, 0, width, 0);
        baseline.addColorStop(0, 'rgba(212, 176, 106, 0.06)');
        baseline.addColorStop(0.5, 'rgba(212, 176, 106, 0.45)');
        baseline.addColorStop(1, 'rgba(212, 176, 106, 0.06)');
        context.strokeStyle = baseline;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(inset, y);
        context.lineTo(width - inset, y);
        context.stroke();
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(0, rect.width);
      height = Math.max(0, rect.height);
      draw();
    };
    const tick = (time) => {
      if (disposed) return;
      if (!document.hidden && time - previousTime >= 1000 / 30) {
        draw();
        previousTime = time;
      }
      frameId = window.requestAnimationFrame(tick);
    };
    redrawRef.current = draw;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (!reducedMotion) frameId = window.requestAnimationFrame(tick);
    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      redrawRef.current = null;
    };
  }, [mode, reducedMotion]);

  // With reduced motion enabled, refresh only on user-driven note changes.
  useEffect(() => { if (reducedMotion) redrawRef.current?.(); }, [activeNotes, reducedMotion]);

  return (
    <section className={`audio-visualizer${variant === 'compact' ? ' audio-visualizer--compact' : ''}`} aria-label="Visualizador de áudio">
      <div className="audio-visualizer__header">
        <div className="audio-visualizer__heading">
          <span className="audio-visualizer__signal" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4" />
            </svg>
          </span>
          <div>
            <p className="audio-visualizer__eyebrow">ESCUTE. SINTA. CRIE.</p>
            <h2>O desenho do seu som</h2>
          </div>
        </div>
        <div className="audio-visualizer__modes" role="group" aria-label="Tipo de visualização">
          <button type="button" aria-pressed={mode === 'waveform'} onClick={() => setMode('waveform')}>Ondas</button>
          <button type="button" aria-pressed={mode === 'spectrum'} onClick={() => setMode('spectrum')}>Espectro</button>
        </div>
      </div>
      <div className="audio-visualizer__plot">
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="audio-visualizer__plot-label" aria-hidden="true">{mode === 'waveform' ? 'WAVEFORM' : 'SPECTRUM'}</span>
      </div>
      <div className="audio-visualizer__footer">
        <span className="audio-visualizer__status"><i aria-hidden="true" />{reducedMotion ? 'Movimento reduzido' : 'Áudio em tempo real'}</span>
        <span className="audio-visualizer__notes" aria-label={noteNames.length ? `Notas: ${noteNames.join(', ')}` : 'Nenhuma tecla pressionada'}>
          <span>{noteNames.length ? 'TOCANDO' : 'PRONTO PARA TOCAR'}</span>
          <strong>{noteNames.length ? `${noteNames.slice(0, 4).join(' · ')}${noteNames.length > 4 ? ` +${noteNames.length - 4}` : ''}` : '—'}</strong>
        </span>
      </div>
    </section>
  );
}
