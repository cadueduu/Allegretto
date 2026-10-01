import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BubbleTrack, Confetti, KidsKeyboard, Mascot, MiniStaff, RhythmView, ScaleStairs, StarRow,
  keysNamed, kidKeyFor, noteInfo, noteMidi, pitchClass, samePitch, staffStep,
} from './kidsShared.jsx';
import { KEY_TIPS, STAFF_TIPS, songById } from './curriculum.js';
import './kids-lesson.css';

const PRAISE = ['Muito bem!', 'Isso aí!', 'Arrasou!', 'Mandou bem!', 'Perfeito!', 'Uau, acertou!'];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
const GREEN = '#3cbf63';
const RED = '#ff5d5d';
// "Dó agudo" for the notes from the Dó in the third space upwards, so both Dós can be told apart.
const staffName = note => `${noteInfo(note).name}${noteMidi(note) >= 72 ? ' agudo' : ''}`;
const matches = (name, target, exact) => (exact ? name === target : samePitch(name, target));
const optionLabel = value => noteInfo(/\d$/.test(value) ? value : `${value}4`).name;
// 'up', 'down' or 'mixed' (five-finger patterns that go up and back down).
const direction = notes => {
  const steps = notes.slice(1).map((n, i) => noteMidi(n) - noteMidi(notes[i]));
  return steps.every(d => d > 0) ? 'up' : steps.every(d => d < 0) ? 'down' : 'mixed';
};

/** Nina asking something. The 🔊 reads it aloud only when the child wants: no voice talking all the time. */
function Prompt({ children, mood = 'happy', speech, say }) {
  return (
    <div className="lx-prompt">
      <Mascot mood={mood} size={72} />
      <div className="lx-prompt__bubble">
        {children}
        {speech && say && <button type="button" className="lx-speaker lx-speaker--small" onClick={() => say(speech)} aria-label="Ouvir a pergunta">🔊</button>}
      </div>
    </div>
  );
}
const NoteWord = ({ note, children }) => <span className="lx-note" style={{ '--c': noteInfo(note).color }}>{children ?? noteInfo(note).name}</span>;

/** Says something, then runs `then` unless the exercise went away meanwhile (also covers StrictMode's double mount). */
function useIntro(say, text, then) {
  useEffect(() => {
    let alive = true;
    say(text).then(() => { if (alive) then?.(); });
    return () => { alive = false; };
  }, []);
}
/** Runs once shortly after the exercise appears (a beat to look before the sound starts). */
function useSoon(fn, ms = 500) {
  useEffect(() => {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
  }, []);
}

function OptionButtons({ options, correct, picked, locked, onPick, label = optionLabel }) {
  return (
    <div className="lx-options">
      {options.map(value => {
        const state = picked == null ? '' : value === correct ? ' is-right' : value === picked ? ' is-wrong' : '';
        return (
          <button type="button" key={value} className={`lx-option${state}`} disabled={locked} onClick={() => onPick(value)}>
            <strong>{label(value)}</strong>
          </button>
        );
      })}
    </div>
  );
}
function BigChoices({ options, correct, picked, locked, onPick }) {
  return (
    <div className="lx-options lx-options--big">
      {options.map(o => {
        const state = picked == null ? '' : o.id === correct ? ' is-right' : o.id === picked ? ' is-wrong' : '';
        return (
          <button type="button" key={o.id} className={`lx-option lx-option--art${state}`} disabled={locked} onClick={() => onPick(o.id)}>
            <span className="lx-option__art" aria-hidden="true">{o.art}</span>
            <strong>{o.label}</strong>
          </button>
        );
      })}
    </div>
  );
}

// ── Exercises ──────────────────────────────────────────────────────────────
// Each gets { ex, answer(ok, detail), locked, setKb, pressRef, sound, say, sayOnce } and reports one answer.
// detail: title, text (shown when wrong: what to remember), okText (shown when right), reveal (keys to light up).

function TipEx({ ex, answer, setKb, sound, say }) {
  const { tip } = ex;
  useEffect(() => {
    setKb(tip.keys || tip.wide ? { mode: tip.keys || 'full', wide: tip.wide, targets: tip.highlight, pointer: false } : null);
  }, []);
  useIntro(say, `${tip.title}. ${tip.text}`);
  return (
    <div className="lx-body">
      <div className="lx-tip">
        <Mascot size={104} />
        <div className="lx-tip__bubble"><strong>{tip.title}</strong><p>{tip.text}</p></div>
      </div>
      {tip.art && <div className="lx-art" aria-hidden="true">{tip.art}</div>}
      {tip.staff && <div className={`lx-staffbox${tip.staff.length > 5 ? ' lx-staffbox--wide' : ''}`}><MiniStaff notes={tip.staff} colored labels={tip.labels} /></div>}
      {tip.stairs && <ScaleStairs notes={tip.stairs} reached={tip.stairs.length} climber={false} />}
      {tip.sounds && (
        <div className="lx-row">
          {tip.sounds.map(([label, seq]) => <button type="button" key={label} className="kids-btn" onClick={() => sound.seq(seq, 100)}>{label}</button>)}
        </div>
      )}
      <button type="button" className="kids-btn kids-btn--go lx-next" onClick={() => answer(true, { silent: true })}>Entendi! →</button>
    </div>
  );
}

function IntroEx({ ex, answer, setKb, pressRef, sound, say }) {
  const info = noteInfo(ex.note);
  useEffect(() => { setKb({ mode: 'full', targets: [ex.note] }); }, []);
  useIntro(say, `Este é o ${info.name}, de ${info.word}!`);
  useEffect(() => {
    pressRef.current = name => { if (samePitch(name, ex.note)) answer(true, { title: `Isso! Esse é o ${info.name}!` }); };
  });
  return (
    <div className="lx-body">
      <p className="lx-kicker">✨ Nota nova</p>
      <div className="lx-hero" style={{ '--c': info.color }}>
        <span className="lx-hero__emoji" aria-hidden="true">{info.emoji}</span>
        <span className="lx-hero__text"><strong>{info.name}</strong><small>de {info.word}</small></span>
        <button type="button" className="lx-speaker" onClick={() => sound.note(ex.note)} aria-label={`Ouvir o ${info.name}`}>🔊</button>
      </div>
      <p className="lx-instruction">Toque o <NoteWord note={ex.note} /> no piano 👇</p>
    </div>
  );
}

function FindEx({ ex, answer, setKb, pressRef, say }) {
  const info = noteInfo(ex.note);
  const tip = KEY_TIPS[pitchClass(ex.note)] || (info.black ? 'É a tecla preta logo à direita do Fá.' : '');
  useEffect(() => { setKb({ mode: ex.keys, wide: ex.wide }); }, []);
  useEffect(() => {
    pressRef.current = name => {
      if (samePitch(name, ex.note)) { answer(true); return; }
      answer(false, { text: ex.keys === 'plain' ? tip : `O ${info.name} é o ${info.emoji}. Olha ele piscando!`, reveal: keysNamed(ex.note, ex.wide) });
    };
  });
  return (
    <div className="lx-body">
      <Prompt say={say} speech={`Toque o ${info.name}`}>Toque o <NoteWord note={ex.note} /></Prompt>
      {ex.hint && <p className="lx-hint">💡 {tip}</p>}
    </div>
  );
}

function NameEx({ ex, answer, locked, setKb, sound, say }) {
  const correct = pitchClass(ex.note);
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb({ mode: ex.keys, marks: [kidKeyFor(ex.note)], pointer: false }); }, []);
  useSoon(() => sound.note(ex.note));
  const pick = pc => {
    setPicked(pc);
    const info = noteInfo(ex.note);
    const why = `Esta nota é o ${info.name}${ex.keys === 'plain' ? `. ${KEY_TIPS[correct]}` : ` ${info.emoji}.`}`;
    answer(pc === correct, { text: why, okText: why });
  };
  return (
    <div className="lx-body">
      <Prompt say={say} speech="Que nota é esta?">Que nota é esta? <button type="button" className="lx-speaker lx-speaker--small" onClick={() => sound.note(ex.note)} aria-label="Ouvir a nota">🎵</button></Prompt>
      <p className="lx-hint">Olhe a tecla com <b>?</b> no piano</p>
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked} onPick={pick} />
    </div>
  );
}

function EarEx({ ex, answer, locked, setKb, sound, sayOnce }) {
  const [picked, setPicked] = useState(null);
  const play = () => sound.seq(ex.seq, 92);
  useEffect(() => { setKb(null); }, []);
  // The question is read the first time it shows up in a lesson; after that it just plays.
  useIntro(sayOnce, ex.question, play);
  const right = ex.options.find(o => o.id === ex.answer);
  return (
    <div className="lx-body">
      <Prompt say={sayOnce} speech={ex.question}>{ex.question}</Prompt>
      <button type="button" className="lx-listen" onClick={play}><span aria-hidden="true">🔊</span> Ouvir de novo</button>
      <BigChoices options={ex.options} correct={ex.answer} picked={picked} locked={locked}
        onPick={id => { setPicked(id); answer(id === ex.answer, { text: `Era ${right.label.toLowerCase()} ${right.art}. Escute de novo com calma na próxima.` }); }} />
    </div>
  );
}

// The parrot: Nina plays (keys lighting up, when `show`), then the child repeats. A wrong note just
// replays the model; only after three tries does it count as a mistake.
function EchoEx({ ex, answer, setKb, pressRef, sound, say }) {
  const BPM = 66;
  const count = ex.notes.length;
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('listen'); // listen | play | done
  const [misses, setMisses] = useState(0);
  const stepRef = useRef(0);
  const phaseRef = useRef('listen');
  const missRef = useRef(0);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = async () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    phaseRef.current = 'listen';
    setPhase('listen');
    stepRef.current = 0;
    setStep(0);
    const seq = ex.notes.map(n => [n, 1]);
    let ms = (count * 60000) / BPM;
    if (ex.show) sound.demo(seq, BPM);
    else ms = (await sound.seq(seq, BPM)).duration;
    later(() => { phaseRef.current = 'play'; setPhase('play'); }, ms + 200);
  };
  useEffect(() => { setKb({ mode: ex.keys }); }, []);
  useSoon(play, 700);
  useEffect(() => {
    pressRef.current = name => {
      if (phaseRef.current !== 'play') return;
      const at = stepRef.current;
      if (samePitch(name, ex.notes[at])) {
        stepRef.current = at + 1;
        setStep(at + 1);
        if (at + 1 === count) { phaseRef.current = 'done'; setPhase('done'); answer(true, { title: 'Igualzinho! 🦜' }); }
        return;
      }
      missRef.current += 1;
      setMisses(missRef.current);
      if (missRef.current >= 3) {
        phaseRef.current = 'done';
        setPhase('done');
        answer(false, { text: `${count === 1 ? 'Era o' : 'Eram'} ${ex.notes.map(n => noteInfo(n).name).join(', ')}.`, reveal: [kidKeyFor(ex.notes[at])] });
        return;
      }
      phaseRef.current = 'listen';
      setPhase('listen');
      later(play, 900);
    };
  });
  const listening = phase === 'listen';
  return (
    <div className="lx-body">
      <Prompt say={say} speech={listening ? 'Olhe e escute' : 'Agora você! Toque igual.'} mood={misses && listening ? 'oops' : 'happy'}>
        {listening ? (misses ? 'Quase! Olhe de novo 👀' : `Olhe e escute ${ex.show ? '👀' : ''}👂`) : 'Agora você! Toque igual 🦜'}
      </Prompt>
      <div className="lx-dots" aria-label={`${step} de ${count}`}>
        {ex.notes.map((n, i) => (
          <span key={i} className={i < step ? 'is-done' : i === step && !listening ? 'is-now' : undefined} style={{ '--c': noteInfo(n).color }}>
            {i < step ? noteInfo(n).emoji : '?'}
          </span>
        ))}
      </div>
      <button type="button" className="lx-listen" onClick={play} disabled={listening}>
        {listening ? <><span aria-hidden="true">👂</span> Escutando…</> : <><span aria-hidden="true">🔁</span> Mostrar de novo</>}
      </button>
    </div>
  );
}

/** Plays a rhythm on one note and reports which of its notes is sounding. */
function usePatternPlayer(sound) {
  const [active, setActive] = useState(-1);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = useCallback(async (pattern, bpm) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const { lead } = await sound.seq(pattern.map(d => ['C5', d, 0.75]), bpm);
    const beatMs = 60000 / bpm;
    let beat = 0;
    pattern.forEach((dur, i) => { timers.current.push(setTimeout(() => setActive(i), lead + beat * beatMs)); beat += dur; });
    timers.current.push(setTimeout(() => setActive(-1), lead + beat * beatMs));
  }, [sound]);
  return { active, play };
}

function RhythmLearnEx({ ex, answer, setKb, sound, say }) {
  const { active, play } = usePatternPlayer(sound);
  useEffect(() => { setKb(null); }, []);
  useIntro(say, ex.text, () => play(ex.pattern, ex.bpm));
  return (
    <div className="lx-body">
      <div className="lx-tip">
        <Mascot size={96} />
        <div className="lx-tip__bubble"><strong>{ex.title}</strong><p>{ex.text}</p></div>
      </div>
      <div className="lx-rhythmbox"><RhythmView pattern={ex.pattern} active={active} /></div>
      <div className="lx-row">
        <button type="button" className="kids-btn kids-btn--listen" onClick={() => play(ex.pattern, ex.bpm)}>🔊 Ouvir</button>
      </div>
      <button type="button" className="kids-btn kids-btn--go lx-next" onClick={() => answer(true, { silent: true })}>Entendi! →</button>
    </div>
  );
}

function RhythmChooseEx({ ex, answer, locked, setKb, sound, sayOnce }) {
  const [picked, setPicked] = useState(null);
  const cards = useRef([]);
  const play = () => sound.seq(ex.options[ex.answer].map(d => ['C5', d, 0.75]), ex.bpm);
  useEffect(() => { setKb(null); }, []);
  useIntro(sayOnce, 'Qual ritmo você ouviu?', play);
  return (
    <div className="lx-body">
      <Prompt say={sayOnce} speech="Qual ritmo você ouviu?">Qual ritmo você ouviu?</Prompt>
      <button type="button" className="lx-listen" onClick={play}><span aria-hidden="true">🔊</span> Ouvir de novo</button>
      <div className="lx-rhythm-options">
        {ex.options.map((pattern, i) => {
          const state = picked == null ? '' : i === ex.answer ? ' is-right' : i === picked ? ' is-wrong' : '';
          return (
            <button type="button" key={i} ref={el => { cards.current[i] = el; }} className={`lx-rcard${state}`} disabled={locked}
              onClick={() => {
                setPicked(i);
                answer(i === ex.answer, { text: 'O ritmo certo está em verde. Fale as sílabas junto: tá, tá-a, ti-ti!' });
                // On small screens the right card may sit below the feedback; bring it up.
                if (i !== ex.answer) cards.current[ex.answer]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}>
              <RhythmView pattern={pattern} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Tap the drum along with the rhythm. Slow, with the rhythm playing softly underneath (guide), wide
// timing windows and a second try before it counts as a mistake.
function RhythmTapEx({ ex, answer, setKb, pressRef, sound, say }) {
  const beatMs = 60000 / ex.bpm;
  const onsets = useMemo(() => { let b = 0; return ex.pattern.map(d => { const s = b; b += d; return s; }); }, [ex.pattern]);
  const length = ex.pattern.reduce((sum, d) => sum + d, 0);
  const tolerance = ex.pattern.includes(0.5) ? 0.28 : 0.4;
  const [phase, setPhase] = useState('ready'); // ready | run | retry | done
  const [beat, setBeat] = useState(-4);
  const [marks, setMarks] = useState([]);
  const phaseRef = useRef('ready');
  const triesRef = useRef(0);
  const t0 = useRef(0);
  const taps = useRef([]);
  const matched = useRef(new Set());
  const { active: listenActive, play } = usePatternPlayer(sound);
  useEffect(() => { setKb(null); }, []);
  useSoon(() => play(ex.pattern, ex.bpm), 600);

  const start = async () => {
    taps.current = [];
    matched.current = new Set();
    setMarks([]);
    // Four slow count-in clicks, then the rhythm itself, softly, to tap along with (or just a tick per beat).
    const countIn = [['G5', 1, 0.55], ['G5', 1, 0.4], ['G5', 1, 0.4], ['G5', 1, 0.4]];
    const underneath = ex.guide ? ex.pattern.map(d => ['C5', d, 0.3]) : Array.from({ length: Math.ceil(length) }, () => ['C6', 1, 0.12]);
    const { lead } = await sound.seq([...countIn, ...underneath], ex.bpm);
    t0.current = performance.now() + lead + 4 * beatMs;
    setBeat(-4);
    phaseRef.current = 'run';
    setPhase('run');
  };
  const finish = () => {
    const hits = matched.current.size;
    const extra = taps.current.length - hits;
    setMarks(onsets.map((_, i) => (matched.current.has(i) ? 'hit' : 'miss')));
    const ok = hits === onsets.length && extra <= 2;
    if (ok) { phaseRef.current = 'done'; setPhase('done'); answer(true, { title: 'No ritmo! 🥁' }); return; }
    if (triesRef.current === 0) { triesRef.current = 1; phaseRef.current = 'retry'; setPhase('retry'); return; }
    phaseRef.current = 'done';
    setPhase('done');
    answer(false, {
      text: taps.current.length === 0 ? 'Toque no tambor quando a contagem acabar!'
        : hits === onsets.length ? 'Sobrou batida. Toque só quando tem nota.' : `Você acertou ${hits} de ${onsets.length}. Fale tá, tá-a, ti-ti enquanto toca!`,
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const id = setInterval(() => {
      const b = (performance.now() - t0.current) / beatMs;
      setBeat(b);
      if (b > length + 0.45) { clearInterval(id); finishRef.current(); }
    }, 33);
    return () => clearInterval(id);
  }, [phase, beatMs, length]);

  const hit = () => {
    if (phaseRef.current !== 'run') return;
    const b = (performance.now() - t0.current) / beatMs;
    if (b < -0.6) return;
    taps.current.push(b);
    const i = onsets.findIndex((onset, k) => !matched.current.has(k) && Math.abs(b - onset) <= tolerance);
    if (i >= 0) {
      matched.current.add(i);
      setMarks(m => { const next = [...m]; next[i] = 'hit'; return next; });
    }
  };
  useEffect(() => { pressRef.current = () => hit(); });

  let active = listenActive;
  if (phase === 'run' && beat >= 0) for (let i = 0; i < onsets.length && onsets[i] <= beat; i += 1) active = i;
  const counting = phase === 'run' && beat < 0;
  const beats = Math.ceil(length);
  return (
    <div className="lx-body">
      <Prompt say={say} speech={ex.guide ? 'Toque o tambor junto com o som' : 'Toque o tambor no ritmo'}>
        {ex.guide ? 'Toque o tambor junto com o som!' : 'Toque o tambor no ritmo!'}
      </Prompt>
      <div className="lx-rhythmbox"><RhythmView pattern={ex.pattern} active={active} marks={marks} /></div>
      {phase === 'run' ? (
        <div className="lx-beats" aria-live="polite">
          {counting ? <span className="lx-count">{Math.max(1, Math.min(4, Math.floor(beat) + 5))}</span>
            : Array.from({ length: beats }, (_, i) => <i key={i} className={Math.floor(beat) === i ? 'is-on' : Math.floor(beat) > i ? 'is-past' : undefined} />)}
        </div>
      ) : phase === 'retry' ? (
        <div className="lx-row">
          <p className="lx-hint">Quase! Vamos de novo, devagarinho? Toque quando ouvir cada nota.</p>
          <button type="button" className="kids-btn kids-btn--go" onClick={start}>▶ Tentar de novo</button>
        </div>
      ) : phase === 'ready' ? (
        <div className="lx-row">
          <button type="button" className="kids-btn kids-btn--listen" onClick={() => play(ex.pattern, ex.bpm)}>🔊 Ouvir o ritmo</button>
          <button type="button" className="kids-btn kids-btn--go" onClick={start}>▶ Começar</button>
        </div>
      ) : null}
      <button type="button" className={`lx-drum${phase === 'run' ? ' is-live' : ''}`} onPointerDown={e => { e.preventDefault(); sound.tap(); hit(); }} aria-label="Tambor">
        <span aria-hidden="true">🥁</span>
      </button>
    </div>
  );
}

function StaffIntroEx({ ex, answer, setKb, pressRef, sound, say }) {
  const info = noteInfo(ex.note);
  useEffect(() => { setKb({ mode: 'full', wide: ex.wide, targets: [ex.note] }); }, []);
  useIntro(say, STAFF_TIPS[ex.note]);
  useEffect(() => {
    pressRef.current = name => { if (matches(name, ex.note, ex.exact)) answer(true, { title: `Isso! ${staffName(ex.note)} na pauta!` }); };
  });
  return (
    <div className="lx-body">
      <p className="lx-kicker">📍 Casinha nova</p>
      <div className="lx-staffcard" style={{ '--c': info.color }}>
        <MiniStaff notes={[ex.note]} colored />
        <div className="lx-staffcard__name">
          <span aria-hidden="true">{info.emoji}</span>
          <strong>{staffName(ex.note)}</strong>
          <button type="button" className="lx-speaker lx-speaker--small" onClick={() => sound.note(ex.note)} aria-label="Ouvir">🔊</button>
        </div>
      </div>
      <p className="lx-hint">{STAFF_TIPS[ex.note]} Toque no piano 👇</p>
    </div>
  );
}

function StaffPlayEx({ ex, answer, setKb, pressRef, say }) {
  useEffect(() => { setKb({ mode: 'full', wide: ex.wide }); }, []);
  useEffect(() => {
    pressRef.current = name => {
      if (matches(name, ex.note, ex.exact)) { answer(true, { okText: STAFF_TIPS[ex.note] }); return; }
      answer(false, { text: `Era o ${staffName(ex.note)}. ${STAFF_TIPS[ex.note]}`, reveal: [ex.note] });
    };
  });
  return (
    <div className="lx-body">
      <Prompt say={say} speech="Que nota é essa? Toque no piano.">Que nota é essa? Toque no piano!</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[ex.note]} current={0} /></div>
    </div>
  );
}

function StaffNameEx({ ex, answer, locked, setKb, sound, say }) {
  const correct = pitchClass(ex.note);
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  return (
    <div className="lx-body">
      <Prompt say={say} speech="Qual é o nome desta nota?">Qual é o nome desta nota?</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[ex.note]} current={0} /></div>
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked}
        onPick={pc => { setPicked(pc); sound.note(ex.note); answer(pc === correct, { text: `É o ${staffName(ex.note)}. ${STAFF_TIPS[ex.note]}`, okText: STAFF_TIPS[ex.note] }); }} />
    </div>
  );
}

function StaffSeqEx({ ex, answer, setKb, pressRef, say }) {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  useEffect(() => { setKb({ mode: 'full', wide: ex.wide }); }, []);
  useEffect(() => {
    pressRef.current = name => {
      const at = stepRef.current;
      if (matches(name, ex.notes[at], ex.exact)) {
        stepRef.current = at + 1;
        setStep(at + 1);
        if (at + 1 === ex.notes.length) answer(true, { title: ex.title ? `Você leu ${ex.title}! 📖` : 'Você leu a partitura! 📖' });
        return;
      }
      answer(false, { text: `Essa nota era o ${staffName(ex.notes[at])}. ${STAFF_TIPS[ex.notes[at]]}`, reveal: [ex.notes[at]] });
    };
  });
  return (
    <div className="lx-body">
      <Prompt say={say} speech="Leia e toque as notas, uma por uma.">
        {ex.title ? <>Leia e toque: <b>{ex.title}</b> 🎶</> : 'Leia e toque as notas, uma por uma 👉'}
      </Prompt>
      <div className="lx-staffbox lx-staffbox--wide"><MiniStaff notes={ex.notes} current={step} passed={step} /></div>
    </div>
  );
}

const LineIcon = () => (
  <svg viewBox="0 0 64 44" width="64" height="44" aria-hidden="true">
    <line x1="2" x2="62" y1="22" y2="22" stroke="#24325f" strokeWidth="2.5" />
    <ellipse cx="32" cy="22" rx="11" ry="8" transform="rotate(-20 32 22)" fill="#24325f" />
  </svg>
);
const SpaceIcon = () => (
  <svg viewBox="0 0 64 44" width="64" height="44" aria-hidden="true">
    <line x1="2" x2="62" y1="8" y2="8" stroke="#24325f" strokeWidth="2.5" />
    <line x1="2" x2="62" y1="36" y2="36" stroke="#24325f" strokeWidth="2.5" />
    <ellipse cx="32" cy="22" rx="11" ry="8" transform="rotate(-20 32 22)" fill="#24325f" />
  </svg>
);

function StaffLinesEx({ ex, answer, locked, setKb, say }) {
  const onLine = staffStep(ex.note) % 2 === 0;
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  const why = onLine ? 'Está numa linha: a linha passa no meio da bolinha.' : 'Está num espaço: a bolinha fica entre duas linhas.';
  return (
    <div className="lx-body">
      <Prompt say={say} speech="A nota está numa linha ou num espaço?">A nota está numa <b>linha</b> ou num <b>espaço</b>?</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[ex.note]} current={0} /></div>
      <BigChoices options={[{ id: 'line', art: <LineIcon />, label: 'Na linha' }, { id: 'space', art: <SpaceIcon />, label: 'No espaço' }]}
        correct={onLine ? 'line' : 'space'} picked={picked} locked={locked}
        onPick={id => { setPicked(id); answer((id === 'line') === onLine, { text: `${why} É o ${staffName(ex.note)}.`, okText: `É o ${staffName(ex.note)}.` }); }} />
    </div>
  );
}

function StaffCompareEx({ ex, answer, locked, setKb, sound, say }) {
  const [a, b] = ex.notes;
  const higher = noteMidi(a) > noteMidi(b) ? 0 : 1;
  const correct = ex.ask === 'high' ? higher : 1 - higher;
  const word = ex.ask === 'high' ? 'aguda' : 'grave';
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  const tint = picked == null ? [] : [0, 1].map(i => (i === correct ? GREEN : i === picked ? RED : undefined));
  const pick = i => {
    setPicked(i);
    sound.seq([[a, 1], [b, 1]], 92);
    const where = `${correct === 0 ? 'A primeira' : 'A segunda'} está mais ${ex.ask === 'high' ? 'alta' : 'baixa'} na pauta, então é mais ${word}.`;
    answer(i === correct, { text: where, okText: where });
  };
  return (
    <div className="lx-body">
      <Prompt say={say} speech={`Qual nota é mais ${word}?`}>Qual nota é mais <b>{word}</b>? {ex.ask === 'high' ? '🐦' : '🐻'}</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[a, b]} tint={tint} /></div>
      <div className="lx-options">
        {['⬅️ A primeira', 'A segunda ➡️'].map((label, i) => {
          const state = picked == null ? '' : i === correct ? ' is-right' : i === picked ? ' is-wrong' : '';
          return <button type="button" key={label} className={`lx-option${state}`} disabled={locked} onClick={() => pick(i)}><strong>{label}</strong></button>;
        })}
      </div>
    </div>
  );
}

function StaffFindEx({ ex, answer, locked, setKb, sound, say }) {
  const [picked, setPicked] = useState(null);
  const info = noteInfo(ex.note);
  useEffect(() => { setKb(null); }, []);
  return (
    <div className="lx-body">
      <Prompt say={say} speech={`Onde mora o ${staffName(ex.note)}?`}>Onde mora o <NoteWord note={ex.note}>{staffName(ex.note)}</NoteWord>?</Prompt>
      <div className="lx-staff-options">
        {ex.options.map((note, i) => {
          const state = picked == null ? '' : i === ex.answer ? ' is-right' : i === picked ? ' is-wrong' : '';
          return (
            <button type="button" key={i} className={`lx-rcard${state}`} disabled={locked}
              onClick={() => { setPicked(i); sound.note(note); answer(i === ex.answer, { text: `${STAFF_TIPS[ex.note]} ${info.emoji}`, okText: STAFF_TIPS[ex.note] }); }}>
              <MiniStaff notes={[note]} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Climb (or go down) the scale: the staircase or the staff shows where you are, and with `guide` the
// next key glows. Wrong keys just shake the step; scales are for practising, not for failing.
function ScalePlayEx({ ex, answer, setKb, pressRef, say }) {
  const count = ex.notes.length;
  const dir = direction(ex.notes);
  const [reached, setReached] = useState(0);
  const [shake, setShake] = useState(0);
  const reachedRef = useRef(0);
  const slips = useRef(0);
  useEffect(() => {
    setKb({ mode: ex.keys, wide: ex.wide, targets: ex.guide && reached < count ? [ex.notes[reached]] : [] });
  }, [reached]);
  useEffect(() => {
    pressRef.current = name => {
      const at = reachedRef.current;
      if (at >= count) return;
      if (name !== ex.notes[at]) { slips.current += 1; setShake(s => s + 1); return; }
      reachedRef.current = at + 1;
      setReached(at + 1);
      const clean = { up: 'Subiu sem tropeçar! 🪜', down: 'Desceu sem tropeçar! 🛝', mixed: 'Dedinhos certinhos! 🖐️' }[dir];
      if (at + 1 === count) answer(true, { title: slips.current === 0 ? clean : 'Você chegou ao fim!' });
    };
  });
  const label = ex.label || `${dir === 'down' ? 'Desça' : 'Suba'} a escada${ex.guide ? '' : ' sozinho'}`;
  return (
    <div className="lx-body">
      <Prompt say={say} speech={label}>{label} {{ up: '⬆️', down: '⬇️', mixed: '🖐️' }[dir]}</Prompt>
      <div key={shake} className={`lx-shakebox${shake ? ' is-shaking' : ''}`}>
        {ex.view === 'staff'
          ? <div className="lx-staffbox lx-staffbox--wide"><MiniStaff notes={ex.notes} current={reached} passed={reached} labels={ex.guide} /></div>
          : <ScaleStairs notes={ex.notes} reached={reached} current={reached} />}
      </div>
      {!ex.guide && ex.view !== 'staff' && reached === 0 && <p className="lx-hint">Sem a mãozinha: comece pelo {staffName(ex.notes[0])}!</p>}
    </div>
  );
}

function ScaleMissingEx({ ex, answer, locked, setKb, sound, say }) {
  const correct = `${pitchClass(ex.notes[ex.missing])}4`;
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  const pick = value => {
    setPicked(value);
    sound.seq(ex.notes.map(n => [n, 0.5]), 120);
    const why = `Faltava o ${noteInfo(ex.notes[ex.missing]).name}: ${ex.notes.map(n => noteInfo(n).name).join(', ')}.`;
    answer(value === correct, { text: why, okText: why });
  };
  return (
    <div className="lx-body">
      <Prompt say={say} speech="Qual nota está faltando na escada?">Qual nota está faltando na escada?</Prompt>
      <ScaleStairs notes={ex.notes} reached={ex.notes.length} missing={picked == null ? ex.missing : -1} climber={false} />
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked} onPick={pick} />
    </div>
  );
}

function ScaleNeighborEx({ ex, answer, locked, setKb, sound, say }) {
  const next = ex.dir === 'next';
  const from = ex.scale[ex.at];
  const target = ex.scale[next ? ex.at + 1 : ex.at - 1];
  const correct = `${pitchClass(target)}4`;
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  const question = `Na escada, qual nota vem ${next ? 'depois' : 'antes'} do ${noteInfo(from).name}?`;
  const pair = next ? [from, target] : [target, from];
  return (
    <div className="lx-body">
      <Prompt say={say} speech={question}>Na escada, qual nota vem <b>{next ? 'depois' : 'antes'}</b> do <NoteWord note={from} />?</Prompt>
      <ScaleStairs notes={pair} reached={2} missing={picked == null ? (next ? 1 : 0) : -1} climber={false} />
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked}
        onPick={value => {
          setPicked(value);
          sound.seq(pair.map(n => [n, 0.8]), 100);
          const why = `${next ? 'Depois' : 'Antes'} do ${noteInfo(from).name} vem o ${noteInfo(target).name}.`;
          answer(value === correct, { text: why, okText: why });
        }} />
    </div>
  );
}

function HalfStepEx({ ex, answer, locked, setKb, say }) {
  const [a, b] = ex.pair;
  const glued = (samePitch(a, 'E') && samePitch(b, 'F')) || (samePitch(a, 'B') && samePitch(b, 'C'));
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb({ mode: 'full', marks: [a, b], pointer: false }); }, []);
  const names = `${noteInfo(a).name} e o ${noteInfo(b).name}`;
  const why = glued ? `Não tem! O ${names} são vizinhos colados.` : `Tem sim: entre o ${names} mora uma tecla preta.`;
  return (
    <div className="lx-body">
      <Prompt say={say} speech={`Entre o ${names} tem tecla preta?`}>Entre o <NoteWord note={a} /> e o <NoteWord note={b} /> tem tecla preta?</Prompt>
      <p className="lx-hint">Olhe as duas teclas com <b>?</b> no piano</p>
      <BigChoices options={[{ id: 'yes', art: '⬛', label: 'Tem' }, { id: 'no', art: '🤝', label: 'Não tem' }]}
        correct={glued ? 'no' : 'yes'} picked={picked} locked={locked}
        onPick={id => { setPicked(id); answer((id === 'no') === glued, { text: why, okText: why }); }} />
    </div>
  );
}

// Put the notes in scale order by tapping them, like building the staircase step by step.
function OrderEx({ ex, answer, locked, setKb, sound, say }) {
  const [cards] = useState(() => {
    let order;
    do { order = ex.notes.map((_, i) => i).sort(() => Math.random() - 0.5); } while (order.every((v, i) => v === i));
    return order;
  });
  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(null);
  const mistakes = useRef(0);
  useEffect(() => { setKb(null); }, []);
  const up = ex.dir !== 'down';
  const tapCard = i => {
    if (locked || placed.includes(i)) return;
    if (i === placed.length) {
      const now = [...placed, i];
      setPlaced(now);
      sound.note(ex.notes[i]);
      if (now.length === ex.notes.length) answer(true, { title: 'Escada montada! 🪜' });
      return;
    }
    mistakes.current += 1;
    setShake({ i, n: mistakes.current });
    if (mistakes.current >= 2) answer(false, { text: `A ordem certa é: ${ex.notes.map(n => noteInfo(n).name).join(', ')}.` });
  };
  const text = `Toque as notas em ordem, ${up ? 'subindo' : 'descendo'} a escada`;
  return (
    <div className="lx-body">
      <Prompt say={say} speech={text}>{text} {up ? '⬆️' : '⬇️'}</Prompt>
      <div className="lx-slots" aria-label={`${placed.length} de ${ex.notes.length}`}>
        {ex.notes.map((n, i) => {
          const info = noteInfo(n);
          return (
            <span key={i} className={i < placed.length ? 'is-on' : undefined} style={{ '--c': info.color }}>
              {i < placed.length ? <><i aria-hidden="true">{info.emoji}</i>{info.name}</> : i + 1}
            </span>
          );
        })}
      </div>
      <div className="lx-cards">
        {cards.map(i => {
          const info = noteInfo(ex.notes[i]);
          return (
            <button type="button" key={shake?.i === i ? `${i}-${shake.n}` : i} className={`lx-card${placed.includes(i) ? ' is-used' : ''}${shake?.i === i ? ' is-wrong' : ''}`}
              style={{ '--c': info.color }} disabled={locked || placed.includes(i)} onClick={() => tapCard(i)}>
              <span aria-hidden="true">{info.emoji}</span>
              <strong>{info.name}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WatchEx({ ex, answer, setKb, sound, demoBeat, demoPlaying }) {
  const song = songById(ex.song);
  const starts = useMemo(() => { let b = 0; return song.notes.map(([, d]) => { const s = b; b += d; return s; }); }, [song]);
  const [heard, setHeard] = useState(false);
  const wasPlaying = useRef(false);
  useEffect(() => { setKb({ mode: 'full' }); return () => sound.stopDemo(); }, []);
  useSoon(() => sound.demo(song.notes, song.bpm), 700);
  useEffect(() => {
    if (demoPlaying) wasPlaying.current = true;
    else if (wasPlaying.current) setHeard(true);
  }, [demoPlaying]);
  let index = 0;
  if (demoPlaying && demoBeat >= 0) for (let i = 0; i < starts.length && starts[i] <= demoBeat + 1e-6; i += 1) index = i;
  return (
    <div className="lx-body">
      <Prompt>Escute e olhe as teclas 👀</Prompt>
      <h3 className="lx-songtitle"><span aria-hidden="true">{song.emoji}</span> {song.title}</h3>
      <BubbleTrack notes={song.notes} index={index} />
      <div className="lx-row">
        <button type="button" className={`kids-btn ${demoPlaying ? 'kids-btn--stop' : 'kids-btn--listen'}`} onClick={() => (demoPlaying ? sound.stopDemo() : sound.demo(song.notes, song.bpm))}>
          {demoPlaying ? '⏹ Parar' : '🔊 Ouvir de novo'}
        </button>
        <button type="button" className={`kids-btn${heard ? ' kids-btn--go' : ''}`} onClick={() => { sound.stopDemo(); answer(true, { silent: true }); }}>
          {heard ? 'Agora é minha vez! →' : 'Pular →'}
        </button>
      </div>
    </div>
  );
}

function PhraseEx({ ex, answer, setKb, pressRef }) {
  const song = songById(ex.song);
  const notes = useMemo(() => song.notes.slice(ex.from, ex.to), [song, ex.from, ex.to]);
  const [index, setIndex] = useState(0);
  const [wiggle, setWiggle] = useState(null);
  const indexRef = useRef(0);
  useEffect(() => { setKb({ mode: 'full', targets: index < notes.length ? [kidKeyFor(notes[index][0])] : [] }); }, [index]);
  useEffect(() => {
    pressRef.current = name => {
      const at = indexRef.current;
      if (at >= notes.length) return;
      if (!samePitch(name, notes[at][0])) { setWiggle(w => ({ n: (w?.n || 0) + 1, at })); return; }
      indexRef.current = at + 1;
      setIndex(at + 1);
      if (at + 1 >= notes.length) answer(true, { title: 'Que lindo! 🎶' });
    };
  });
  const pct = Math.round((index / notes.length) * 100);
  return (
    <div className="lx-body">
      <Prompt><span aria-hidden="true">{song.emoji}</span> {song.title}: <b>{ex.label}</b></Prompt>
      <div className="kids-path" aria-label={`${pct}% do trecho`}>
        <span className="kids-path__fill" style={{ width: `${pct}%`, background: song.color }} />
        <span className="kids-path__walker" style={{ left: `${pct}%` }} aria-hidden="true">{song.emoji}</span>
        <span className="kids-path__flag" aria-hidden="true">🏁</span>
      </div>
      <BubbleTrack notes={notes} index={index} wiggle={wiggle} />
    </div>
  );
}

const EXERCISES = {
  tip: TipEx, intro: IntroEx, find: FindEx, name: NameEx, ear: EarEx, echo: EchoEx,
  'rhythm-learn': RhythmLearnEx, 'rhythm-choose': RhythmChooseEx, 'rhythm-tap': RhythmTapEx,
  'staff-intro': StaffIntroEx, 'staff-play': StaffPlayEx, 'staff-name': StaffNameEx, 'staff-seq': StaffSeqEx,
  'staff-lines': StaffLinesEx, 'staff-compare': StaffCompareEx, 'staff-find': StaffFindEx,
  'scale-play': ScalePlayEx, 'scale-missing': ScaleMissingEx, 'scale-neighbor': ScaleNeighborEx, 'half-step': HalfStepEx, order: OrderEx,
  watch: WatchEx, phrase: PhraseEx,
};
const starsFor = mistakes => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

// ── Lesson runner ──────────────────────────────────────────────────────────

export default function KidsLesson({ lesson, unit, active, sparks, pointerHandlers, pressRef, sound, say, demoBeat, demoPlaying, onQuit, onComplete }) {
  const [initialQueue] = useState(() => lesson.build());
  const queueRef = useRef(initialQueue);
  const total = initialQueue.length;
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);
  const mistakesRef = useRef(0);
  const [kb, setKb] = useState(null);
  const [quitting, setQuitting] = useState(false);
  const [summary, setSummary] = useState(null);
  // Questions that repeat in a lesson are read aloud only the first time.
  const spoken = useRef(new Set());
  const sayOnce = useCallback(text => {
    if (spoken.current.has(text)) return Promise.resolve();
    spoken.current.add(text);
    return say(text);
  }, [say]);

  const advance = useCallback(() => {
    resultRef.current = null;
    setResult(null);
    const next = posRef.current + 1;
    if (next >= queueRef.current.length) {
      pressRef.current = null;
      setKb(null);
      const mistakes = mistakesRef.current;
      const stars = starsFor(mistakes);
      const xp = 10 + (mistakes === 0 ? 5 : 0) + (lesson.review ? 5 : 0);
      setSummary({ stars, xp, accuracy: Math.round((total / (total + mistakes)) * 100) });
      sound.jingle('fanfare');
      say('Lição completa!');
      return;
    }
    posRef.current = next;
    setPos(next);
  }, [lesson, pressRef, say, sound, total]);

  // Right or wrong, feedback is a sound and a few words on screen; the voice stays quiet.
  const answer = useCallback((ok, detail = {}) => {
    if (resultRef.current) return;
    if (ok) {
      setCorrect(c => c + 1);
      if (detail.silent) { advance(); return; }
      setCombo(c => c + 1);
      sound.jingle('success');
      resultRef.current = { ok: true, title: detail.title || praise(), text: detail.okText };
    } else {
      mistakesRef.current += 1;
      setCombo(0);
      // Like a good teacher: what went wrong comes back at the end of the lesson.
      const current = queueRef.current[posRef.current];
      queueRef.current = [...queueRef.current, { ...current, uid: `${current.uid}-again-${queueRef.current.length}` }];
      resultRef.current = { ok: false, title: detail.title || 'Quase!', text: detail.text };
      if (detail.reveal) setKb(k => (k ? { ...k, targets: detail.reveal, marks: [], pointer: true } : k));
    }
    setResult(resultRef.current);
  }, [advance, sound]);

  // Enter continues after the feedback, like the button.
  useEffect(() => {
    if (!result) return undefined;
    const onKey = e => { if (e.key === 'Enter') { e.preventDefault(); advance(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [result, advance]);

  const exercise = queueRef.current[pos];
  const Exercise = EXERCISES[exercise?.type];
  const progress = Math.min(1, correct / total);

  if (summary) {
    return (
      <div className="kids-lesson" style={{ '--u': unit.color }}>
        <div className="lx-finish">
          <Confetti />
          <Mascot mood="cheer" size={150} className="lx-finish__mascot" />
          <h2>{lesson.practice ? 'Treino completo!' : 'Lição completa!'}</h2>
          <p>{lesson.title}</p>
          <div className="lx-stats">
            <div className="lx-stat lx-stat--xp"><small>XP ganho</small><strong>⚡ {summary.xp}</strong></div>
            <div className="lx-stat lx-stat--acc"><small>Acertos</small><strong>🎯 {summary.accuracy}%</strong></div>
            <div className="lx-stat lx-stat--stars"><small>Estrelas</small><StarRow count={summary.stars} animate /></div>
          </div>
          <button type="button" className="kids-btn kids-btn--go lx-finish__go" onClick={() => onComplete(summary)}>Continuar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="kids-lesson" style={{ '--u': unit.color }}>
      <div className="lx-top">
        <button type="button" className="lx-close" onClick={() => setQuitting(true)} aria-label="Sair da lição">✕</button>
        <div className="lx-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={correct} aria-label="Progresso da lição">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={`lx-combo${combo >= 3 ? ' is-on' : ''}`} aria-live="polite">{combo >= 3 ? `🔥 ${combo}` : ''}</span>
      </div>

      <div className={`lx-stage${result ? ' has-sheet' : ''}`}>
        <div className="lx-scroll">
          {Exercise && (
            <Exercise key={`${pos}-${exercise.uid}`} ex={exercise} answer={answer} locked={!!result} setKb={setKb}
              pressRef={pressRef} sound={sound} say={say} sayOnce={sayOnce} demoBeat={demoBeat} demoPlaying={demoPlaying} />
          )}
        </div>
        {result && (
          <div className={`lx-sheet ${result.ok ? 'is-ok' : 'is-bad'}`} role="status">
            <Mascot mood={result.ok ? 'cheer' : 'oops'} size={58} />
            <div className="lx-sheet__text">
              <strong>{result.title}</strong>
              {result.text && <p>{result.text}</p>}
            </div>
            <button type="button" className="kids-btn lx-sheet__btn" onClick={advance} autoFocus>{result.ok ? 'Continuar' : 'Entendi'}</button>
          </div>
        )}
      </div>

      {kb && (
        <KidsKeyboard active={active} sparks={sparks} pointerHandlers={pointerHandlers} mode={kb.mode} wide={kb.wide}
          targets={new Set(kb.targets || [])} marks={new Set(kb.marks || [])} pointer={kb.pointer !== false} />
      )}

      {quitting && (
        <div className="kids-celebrate" role="dialog" aria-modal="true" aria-label="Sair da lição">
          <div className="kids-celebrate__card">
            <Mascot mood="oops" size={96} />
            <h2>Quer mesmo sair?</h2>
            <p>Se sair agora, esta lição começa do zero na próxima vez.</p>
            <div className="kids-celebrate__actions">
              <button type="button" className="kids-btn kids-btn--go" onClick={() => setQuitting(false)}>Continuar aprendendo</button>
              <button type="button" className="kids-btn" onClick={onQuit}>Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
