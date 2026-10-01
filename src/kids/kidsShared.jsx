import { useMemo } from 'react';

// Each note gets a color (like the colored bells kids learn with), a picture and a word that starts
// with its name, so a child who can't read yet can still find "Mi" as "the yellow cat key".
export const NOTE_INFO = {
  C: { name: 'Dó',  emoji: '🍬', word: 'doce', color: '#ff5d5d' },
  D: { name: 'Ré',  emoji: '👑', word: 'rei',  color: '#ff9a3c' },
  E: { name: 'Mi',  emoji: '🐱', word: 'miau', color: '#ffc928' },
  F: { name: 'Fá',  emoji: '🧚', word: 'fada', color: '#43c96b' },
  G: { name: 'Sol', emoji: '☀️', word: 'sol',  color: '#22b8d6' },
  A: { name: 'Lá',  emoji: '🧶', word: 'lã',   color: '#5b7cfa' },
  B: { name: 'Si',  emoji: '🔔', word: 'sino', color: '#b065f0' },
};
// Black keys by their everyday names (Si♭ is the one "Parabéns" uses).
const BLACK_NAMES = { 'C#': 'Dó♯', 'D#': 'Mi♭', 'F#': 'Fá♯', 'G#': 'Sol♯', 'A#': 'Si♭' };
export const WHITE_PCS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// One octave plus the top Dó: big keys, and every kids' song fits in it.
export const KID_WHITE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const KID_BLACK = [['C#4', 0], ['D#4', 1], ['F#4', 3], ['G#4', 4], ['A#4', 5]]; // [note, white key it follows]
export const KID_KEYS = new Set([...KID_WHITE, ...KID_BLACK.map(([name]) => name)]);

export const pitchClass = name => name.replace(/-?\d+$/, '');
export const samePitch = (a, b) => pitchClass(a) === pitchClass(b);
// Notes from outside the little keyboard (MIDI, the computer's upper row) show on the key with the same name.
export const kidKeyFor = name => (KID_KEYS.has(name) ? name : `${pitchClass(name)}4`);
/** Every key on the little keyboard with this note's name (both Dós for C). */
export const keysNamed = name => [...KID_KEYS].filter(key => samePitch(key, name));
export function noteInfo(name) {
  const pc = pitchClass(name);
  if (NOTE_INFO[pc]) return NOTE_INFO[pc];
  return { name: BLACK_NAMES[pc] || pc, emoji: pc === 'A#' || pc === 'D#' ? '♭' : '♯', word: null, color: '#3b3f6b', black: true };
}

// Traditional tunes, written in the little keyboard's range. [note, beats]
export const KIDS_SONGS = [
  {
    id: 'doremi', title: 'Dó Ré Mi Fá', emoji: '🎈', color: '#ff5d5d', bpm: 100,
    notes: [
      ['C4', 0.5], ['D4', 0.5], ['E4', 0.5], ['F4', 0.5], ['F4', 1], ['F4', 1],
      ['C4', 0.5], ['D4', 0.5], ['C4', 0.5], ['D4', 0.5], ['D4', 1], ['D4', 1],
      ['C4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 0.5], ['E4', 1], ['E4', 1],
      ['C4', 0.5], ['D4', 0.5], ['E4', 0.5], ['F4', 0.5], ['F4', 1], ['F4', 1],
    ],
  },
  {
    id: 'mary', title: 'O Carneirinho', emoji: '🐑', color: '#43c96b', bpm: 96,
    notes: [
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 2],
      ['D4', 1], ['D4', 1], ['D4', 2], ['E4', 1], ['G4', 1], ['G4', 2],
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 1], ['E4', 1],
      ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 1], ['C4', 4],
    ],
  },
  {
    id: 'twinkle', title: 'Brilha Brilha Estrelinha', emoji: '⭐', color: '#ffc928', bpm: 92,
    notes: [
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
    ],
  },
  {
    id: 'ode', title: 'Hino da Alegria', emoji: '🎉', color: '#22b8d6', bpm: 92,
    notes: [
      ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1.5], ['D4', 0.5], ['D4', 2],
      ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1.5], ['C4', 0.5], ['C4', 2],
    ],
  },
  {
    id: 'jingle', title: 'Jingle Bells', emoji: '🎄', color: '#5b7cfa', bpm: 112,
    notes: [
      ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2],
      ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4],
      ['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', 0.5], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', 0.5], ['E4', 0.5],
      ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2],
    ],
  },
  {
    id: 'parabens', title: 'Parabéns pra Você', emoji: '🎂', color: '#b065f0', bpm: 100,
    notes: [
      ['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['F4', 1], ['E4', 2],
      ['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['G4', 1], ['F4', 2],
      ['C4', 0.75], ['C4', 0.25], ['C5', 1], ['A4', 1], ['F4', 1], ['E4', 1], ['D4', 2],
      ['A#4', 0.75], ['A#4', 0.25], ['A4', 1], ['F4', 1], ['G4', 1], ['F4', 3],
    ],
  },
];

/** Speaks in Brazilian Portuguese; resolves when done (or right away when the voice is off). */
export function speak(text, enabled) {
  return new Promise(resolve => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) { resolve(); return; }
    try {
      const synth = window.speechSynthesis;
      synth.cancel(); // only the latest thing matters when little hands play fast
      const utterance = new SpeechSynthesisUtterance(text.replace(/♯/g, ' sustenido').replace(/♭/g, ' bemol'));
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      utterance.pitch = 1.2;
      const voice = synth.getVoices().find(v => v.lang?.toLowerCase().startsWith('pt'));
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
      // Some browsers never fire onend; don't let a lesson wait on them.
      setTimeout(resolve, 900 + text.length * 85);
    } catch { resolve(); }
  });
}

export function Star({ on, delay }) {
  return (
    <svg className={`kids-star${on ? ' is-on' : ''}`} style={delay ? { animationDelay: delay } : undefined} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
    </svg>
  );
}

export function StarRow({ count = 0, animate = false }) {
  return (
    <span className="kids-starrow" aria-label={`${count} de 3 estrelas`}>
      {[1, 2, 3].map(n => <Star key={n} on={n <= count} delay={animate ? `${0.25 + n * 0.22}s` : undefined} />)}
    </span>
  );
}

export function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 42 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.6 + Math.random() * 1.2,
    turn: Math.round(Math.random() * 720 - 360),
    color: Object.values(NOTE_INFO)[i % 7].color,
    round: i % 3 === 0,
  })), []);
  return (
    <div className="kids-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} className={p.round ? 'is-round' : undefined}
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, '--turn': `${p.turn}deg` }} />
      ))}
    </div>
  );
}

/** Nina, the little eighth note who teaches. Moods: happy, cheer, oops. */
export function Mascot({ mood = 'happy', size = 96, className = '' }) {
  const ink = '#24325f';
  return (
    <svg className={`kids-mascot is-${mood} ${className}`} width={size} height={size * 1.08} viewBox="0 0 120 130" aria-hidden="true">
      <ellipse cx="54" cy="124" rx="30" ry="5" fill="rgba(36,50,95,.14)" />
      <rect x="79" y="12" width="9" height="94" rx="4.5" fill="#6a4af0" />
      <path d="M86 13 C104 22 114 38 106 62 C103 49 97 41 86 38 Z" fill="#6a4af0" />
      <ellipse cx="52" cy="96" rx="37" ry="28" transform="rotate(-18 52 96)" fill="#7c5cff" />
      <ellipse cx="37" cy="83" rx="11" ry="6" transform="rotate(-18 37 83)" fill="#fff" opacity=".22" />
      <circle cx="31" cy="104" r="5.5" fill="#ff8fb1" opacity=".75" />
      <circle cx="74" cy="100" r="5.5" fill="#ff8fb1" opacity=".75" />
      {mood === 'cheer' ? (
        <>
          <path d="M33 95 q7 -9 14 0" stroke={ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M56 91 q7 -9 14 0" stroke={ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M43 104 q10 14 20 -3 Z" fill={ink} />
          <path d="M48 108 q5 4 10 -1" fill="#ff7a8a" />
        </>
      ) : (
        <>
          <ellipse cx="40" cy="93" rx="7" ry="8.5" fill="#fff" />
          <ellipse cx="63" cy="89" rx="7" ry="8.5" fill="#fff" />
          <circle cx={mood === 'oops' ? 40 : 41.5} cy={mood === 'oops' ? 96.5 : 94.5} r="4.2" fill={ink} />
          <circle cx={mood === 'oops' ? 63 : 64.5} cy={mood === 'oops' ? 92.5 : 90.5} r="4.2" fill={ink} />
          <circle cx="43" cy="92.5" r="1.4" fill="#fff" />
          <circle cx="66" cy="88.5" r="1.4" fill="#fff" />
          {mood === 'oops'
            ? <ellipse cx="54" cy="107" rx="4.2" ry="3.6" fill={ink} />
            : <path d="M46 104 q8 8 16 -2" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
        </>
      )}
    </svg>
  );
}

/**
 * The big colorful keyboard. mode: 'full' (picture + name), 'emoji' (picture only) or 'plain' (blank keys,
 * like a real piano). targets glow in their color with a pointing hand; marks glow gold with a "?".
 */
export function KidsKeyboard({ lit, targets = new Set(), marks = new Set(), pointerHandlers, sparks = [], mode = 'full', pointer = true }) {
  const key = (name, black, style) => {
    const info = noteInfo(name);
    const on = lit.has(name);
    const target = targets.has(name);
    const mark = marks.has(name);
    return (
      <button type="button" key={name} aria-label={mode === 'plain' ? (black ? 'Tecla preta' : 'Tecla branca') : info.name}
        className={`kids-key${black ? ' kids-key--black' : ''}${on ? ' is-on' : ''}${target ? ' is-target' : ''}${mark ? ' is-mark' : ''}`}
        style={{ '--c': info.color, ...style }} {...pointerHandlers(name)}>
        {target && pointer && <span className="kids-key__pointer" aria-hidden="true">👇</span>}
        {mark && <span className="kids-key__ask" aria-hidden="true">?</span>}
        {mode !== 'plain' && (
          <span className="kids-key__cap" aria-hidden="true">
            <span className="kids-key__emoji">{info.emoji}</span>
            {mode === 'full' && <span className="kids-key__name">{info.name}</span>}
          </span>
        )}
        {sparks.filter(s => s.key === name).map(s => <span key={s.id} className="kids-spark" aria-hidden="true">{s.glyph}</span>)}
      </button>
    );
  };
  return (
    <div className={`kids-piano kids-piano--${mode}`}>
      <div className="kids-piano__keys" role="group" aria-label="Teclado">
        {KID_WHITE.map(name => key(name, false))}
        {KID_BLACK.map(([name, after]) => key(name, true, { left: `calc(${((after + 1) / KID_WHITE.length) * 100}% - var(--black-w) / 2)` }))}
      </div>
    </div>
  );
}

// Diatonic steps from middle C, for drawing on the treble staff (E4 sits on the bottom line).
const STAFF_STEP = { C4: 0, D4: 1, E4: 2, F4: 3, G4: 4, A4: 5, B4: 6, C5: 7 };

/** A small treble staff. current: index to circle; passed: how many are already played (drawn green). */
export function MiniStaff({ notes, colored = false, current = -1, passed = 0 }) {
  const SL = 14;
  const TOP = 26;
  const STEP_W = 50;
  const LEFT = 78;
  const width = LEFT + Math.max(1, notes.length) * STEP_W + 18;
  const y = step => TOP + (10 - step) * (SL / 2);
  return (
    <svg className="kids-staff" viewBox={`0 0 ${width} 126`} role="img" aria-label={`Pauta com ${notes.length === 1 ? 'uma nota' : `${notes.length} notas`}`}>
      {[10, 8, 6, 4, 2].map(step => <line key={step} x1="8" x2={width - 8} y1={y(step)} y2={y(step)} stroke="#24325f" strokeOpacity=".55" strokeWidth="1.6" />)}
      <text x="6" y={TOP + SL * 4 + 8} fontSize={SL * 5.6} fill="#24325f" fontFamily="'Segoe UI Symbol','Noto Music',serif">𝄞</text>
      {notes.map((name, i) => {
        const step = STAFF_STEP[name] ?? 6;
        const cx = LEFT + i * STEP_W + STEP_W / 2;
        const cy = y(step);
        const done = i < passed;
        const color = done ? '#3cbf63' : colored ? noteInfo(name).color : '#24325f';
        const up = step < 6;
        return (
          <g key={i}>
            {i === current && <circle cx={cx} cy={cy} r="17" fill="#ffc928" opacity=".35" className="kids-staff__halo" />}
            {step <= 0 && <line x1={cx - 15} x2={cx + 15} y1={y(0)} y2={y(0)} stroke="#24325f" strokeWidth="1.8" />}
            <ellipse cx={cx} cy={cy} rx="9.5" ry="7" transform={`rotate(-20 ${cx} ${cy})`} fill={color} />
            <line x1={up ? cx + 8.6 : cx - 8.6} x2={up ? cx + 8.6 : cx - 8.6} y1={cy + (up ? -2 : 2)} y2={up ? cy - SL * 3.4 : cy + SL * 3.4} stroke={color} strokeWidth="2.2" />
          </g>
        );
      })}
    </svg>
  );
}

const SYLLABLE = { 1: 'tá', 2: 'tá-a', 0.5: 'ti' };
/** Rhythm in note shapes with the syllables kids say: tá (1 beat), tá-a (2), ti-ti (two halves). */
export function RhythmView({ pattern, active = -1, marks = [] }) {
  const BEAT = 58;
  const items = [];
  let x = 10;
  pattern.forEach((dur, i) => { items.push({ dur, i, x }); x += dur * BEAT; });
  // Two halves in a row share a beam (ti-ti); a lone half gets a flag.
  const pairStarts = new Set();
  for (let i = 0; i < pattern.length; i += 1) if (pattern[i] === 0.5 && pattern[i + 1] === 0.5) { pairStarts.add(i); i += 1; }
  const paired = i => pairStarts.has(i) || pairStarts.has(i - 1);
  const width = x + 10;
  const colorOf = i => (marks[i] === 'hit' ? '#3cbf63' : marks[i] === 'miss' ? '#ff5d5d' : i === active ? '#5b7cfa' : '#24325f');
  return (
    <svg className="kids-rhythm" viewBox={`0 0 ${width} 96`} role="img" aria-label={pattern.map(d => SYLLABLE[d] || 'tá').join(' ')}>
      {items.map(({ dur, i, x: nx }) => {
        const c = colorOf(i);
        const hx = nx + 14;
        return (
          <g key={i}>
            {i === active && <rect x={nx - 2} y="2" width={dur * BEAT} height="92" rx="12" fill="#5b7cfa" opacity=".12" />}
            {dur === 2
              ? <ellipse cx={hx} cy="56" rx="10" ry="7.5" transform={`rotate(-20 ${hx} 56)`} fill="none" stroke={c} strokeWidth="3.2" />
              : <ellipse cx={hx} cy="56" rx="10" ry="7.5" transform={`rotate(-20 ${hx} 56)`} fill={c} />}
            <line x1={hx + 9} x2={hx + 9} y1="54" y2="14" stroke={c} strokeWidth="3" />
            {pairStarts.has(i) && <rect x={hx + 7.5} y="12" width={BEAT * 0.5 + 3} height="7" rx="2" fill={c} />}
            {dur === 0.5 && !paired(i) && <path d={`M${hx + 9} 14 q14 8 10 26`} stroke={c} strokeWidth="3" fill="none" />}
            <text x={hx} y="90" textAnchor="middle" fontSize="15" fontWeight="700" fill={c} fontFamily="Fredoka, sans-serif">{SYLLABLE[dur] || 'tá'}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Bubbles of the notes to play, the current one big and bouncing. */
export function BubbleTrack({ notes, index, wiggle }) {
  return (
    <div className="kids-track" aria-live="polite">
      {notes.map(([name], i) => {
        const offset = i - index;
        if (offset < -1 || offset > 6) return null;
        const info = noteInfo(name);
        const shaking = offset === 0 && wiggle && wiggle.at === i;
        return (
          <div key={i} className={`kids-bubble${offset === 0 ? ' is-now' : ''}${offset < 0 ? ' is-gone' : ''}${info.black ? ' is-black' : ''}`}
            style={{ '--c': info.color, '--o': offset }} aria-hidden={offset !== 0}>
            <span key={shaking ? `w${wiggle.n}` : 'still'} className={`kids-bubble__inner${shaking ? ' is-wrong' : ''}`}>
              <span className="kids-bubble__emoji">{info.emoji}</span>
              <span className="kids-bubble__name">{info.name}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
