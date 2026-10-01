import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BubbleTrack, Confetti, KidsKeyboard, Mascot, MiniStaff, NOTE_INFO, RhythmView, StarRow,
  keysNamed, kidKeyFor, noteInfo, pitchClass, samePitch,
} from './kidsShared.jsx';
import { KEY_TIPS, STAFF_TIPS, songById } from './curriculum.js';
import './kids-lesson.css';

const PRAISE = ['Muito bem!', 'Isso aí!', 'Arrasou!', 'Mandou bem!', 'Perfeito!', 'Uau, acertou!'];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
const staffName = note => `${noteInfo(note).name}${note === 'C5' ? ' agudo' : ''}`;

function Prompt({ children, mood = 'happy' }) {
  return (
    <div className="lx-prompt">
      <Mascot mood={mood} size={72} />
      <div className="lx-prompt__bubble">{children}</div>
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

// ── Exercises ──────────────────────────────────────────────────────────────
// Each gets { ex, answer(ok, detail), locked, setKb, pressRef, sound, say } and reports one answer.
// detail: title, text (shown when wrong: what to remember), okText (shown when right), reveal (keys to light up).

function TipEx({ ex, answer, setKb, sound, say }) {
  const { tip } = ex;
  useEffect(() => { setKb(tip.keys ? { mode: tip.keys, targets: tip.highlight, pointer: false } : null); }, []);
  useIntro(say, `${tip.title}. ${tip.text}`);
  return (
    <div className="lx-body">
      <div className="lx-tip">
        <Mascot size={104} />
        <div className="lx-tip__bubble"><strong>{tip.title}</strong><p>{tip.text}</p></div>
      </div>
      {tip.art && <div className="lx-art" aria-hidden="true">{tip.art}</div>}
      {tip.staff && <div className="lx-staffbox"><MiniStaff notes={tip.staff} colored /></div>}
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
  useIntro(say, `Este é o ${info.name}, de ${info.word}! Toque o ${info.name}.`);
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
  const tip = KEY_TIPS[pitchClass(ex.note)];
  useEffect(() => { setKb({ mode: ex.keys }); }, []);
  useIntro(say, `Toque o ${info.name}`);
  useEffect(() => {
    pressRef.current = name => {
      if (samePitch(name, ex.note)) { answer(true); return; }
      answer(false, { text: ex.keys === 'plain' ? tip : `O ${info.name} é o ${info.emoji}. Olha ele piscando!`, reveal: keysNamed(ex.note) });
    };
  });
  return (
    <div className="lx-body">
      <Prompt>Toque o <NoteWord note={ex.note} /></Prompt>
      {ex.hint && <p className="lx-hint">💡 {tip}</p>}
    </div>
  );
}

function OptionButtons({ options, correct, picked, locked, onPick }) {
  return (
    <div className="lx-options">
      {options.map(pc => {
        const state = picked == null ? '' : pc === correct ? ' is-right' : pc === picked ? ' is-wrong' : '';
        return (
          <button type="button" key={pc} className={`lx-option${state}`} disabled={locked} onClick={() => onPick(pc)}>
            <strong>{NOTE_INFO[pc].name}</strong>
          </button>
        );
      })}
    </div>
  );
}

function NameEx({ ex, answer, locked, setKb, sound, say }) {
  const correct = pitchClass(ex.note);
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb({ mode: ex.keys, marks: [kidKeyFor(ex.note)], pointer: false }); }, []);
  useIntro(say, 'Que nota é esta?', () => sound.note(ex.note));
  const pick = pc => {
    setPicked(pc);
    const info = NOTE_INFO[correct];
    const why = `Esta nota é o ${info.name}${ex.keys === 'plain' ? `. ${KEY_TIPS[correct]}` : ` ${info.emoji}.`}`;
    answer(pc === correct, { text: why, okText: why });
  };
  return (
    <div className="lx-body">
      <Prompt>Que nota é esta? <button type="button" className="lx-speaker lx-speaker--small" onClick={() => sound.note(ex.note)} aria-label="Ouvir a nota">🔊</button></Prompt>
      <p className="lx-hint">Olhe a tecla com <b>?</b> no piano</p>
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked} onPick={pick} />
    </div>
  );
}

function EarEx({ ex, answer, locked, setKb, sound, say }) {
  const [picked, setPicked] = useState(null);
  const play = () => sound.seq(ex.seq, 96);
  useEffect(() => { setKb(null); }, []);
  useIntro(say, ex.question, play);
  const right = ex.options.find(o => o.id === ex.answer);
  return (
    <div className="lx-body">
      <Prompt>{ex.question}</Prompt>
      <button type="button" className="lx-listen" onClick={play}><span aria-hidden="true">🔊</span> Ouvir de novo</button>
      <div className="lx-options lx-options--big">
        {ex.options.map(o => {
          const state = picked == null ? '' : o.id === ex.answer ? ' is-right' : o.id === picked ? ' is-wrong' : '';
          return (
            <button type="button" key={o.id} className={`lx-option lx-option--art${state}`} disabled={locked}
              onClick={() => { setPicked(o.id); answer(o.id === ex.answer, { text: `Era ${right.label.toLowerCase()} ${right.art}. Toque em "Ouvir de novo" na próxima e preste atenção.` }); }}>
              <span className="lx-option__art" aria-hidden="true">{o.art}</span>
              <strong>{o.label}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EchoEx({ ex, answer, setKb, pressRef, sound, say }) {
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(true);
  const stepRef = useRef(0);
  const listeningRef = useRef(true);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const play = async () => {
    listeningRef.current = true;
    setListening(true);
    const { duration } = await sound.seq(ex.notes.map(n => [n, 1]), 96);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { listeningRef.current = false; setListening(false); }, duration);
  };
  useEffect(() => { setKb({ mode: ex.keys }); }, []);
  const count = ex.notes.length;
  useIntro(say, count === 1 ? 'Escute e toque a mesma nota' : `Escute e toque as ${count} notas`, play);
  useEffect(() => {
    pressRef.current = name => {
      if (listeningRef.current) return;
      const at = stepRef.current;
      if (samePitch(name, ex.notes[at])) {
        stepRef.current = at + 1;
        setStep(at + 1);
        if (at + 1 === count) answer(true);
        return;
      }
      answer(false, { text: `${count === 1 ? 'Era o' : 'Eram'} ${ex.notes.map(n => noteInfo(n).name).join(', ')}.`, reveal: [kidKeyFor(ex.notes[at])] });
    };
  });
  return (
    <div className="lx-body">
      <Prompt>{count === 1 ? 'Escute e toque a mesma nota' : `Escute e toque as ${count} notas`} 🦜</Prompt>
      <button type="button" className="lx-listen" onClick={play} disabled={listening}>
        {listening ? <><span aria-hidden="true">👂</span> Escutando…</> : <><span aria-hidden="true">🔊</span> Ouvir de novo</>}
      </button>
      <div className="lx-dots" aria-label={`${step} de ${count}`}>
        {ex.notes.map((n, i) => (
          <span key={i} className={i < step ? 'is-done' : undefined} style={{ '--c': noteInfo(n).color }}>{i < step ? noteInfo(n).emoji : '?'}</span>
        ))}
      </div>
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

function RhythmChooseEx({ ex, answer, locked, setKb, sound, say }) {
  const [picked, setPicked] = useState(null);
  const cards = useRef([]);
  const play = () => sound.seq(ex.options[ex.answer].map(d => ['C5', d, 0.75]), ex.bpm);
  useEffect(() => { setKb(null); }, []);
  useIntro(say, 'Qual ritmo você ouviu?', play);
  return (
    <div className="lx-body">
      <Prompt>Qual ritmo você ouviu?</Prompt>
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

function RhythmTapEx({ ex, answer, setKb, pressRef, sound, say }) {
  const beatMs = 60000 / ex.bpm;
  const onsets = useMemo(() => { let b = 0; return ex.pattern.map(d => { const s = b; b += d; return s; }); }, [ex.pattern]);
  const length = ex.pattern.reduce((sum, d) => sum + d, 0);
  // Generous windows for little hands; tighter when "ti-ti" puts notes half a beat apart.
  const tolerance = ex.pattern.includes(0.5) ? 0.22 : 0.32;
  const [phase, setPhase] = useState('ready'); // ready | run | done
  const [beat, setBeat] = useState(-9);
  const [marks, setMarks] = useState([]);
  const phaseRef = useRef('ready');
  const t0 = useRef(0);
  const taps = useRef([]);
  const matched = useRef(new Set());
  const { active: listenActive, play } = usePatternPlayer(sound);
  useEffect(() => { setKb(null); }, []);
  useIntro(say, 'Escute o ritmo. Depois aperte começar e toque no tambor junto.', () => play(ex.pattern, ex.bpm));

  const start = async () => {
    taps.current = [];
    matched.current = new Set();
    setMarks([]);
    // Four count-in clicks, then a soft tick on every beat to lean on.
    const countIn = [['G5', 1, 0.55], ['G5', 1, 0.4], ['G5', 1, 0.4], ['G5', 1, 0.4]];
    const ticks = Array.from({ length: Math.ceil(length) }, () => ['C6', 1, 0.12]);
    const { lead } = await sound.seq([...countIn, ...ticks], ex.bpm);
    t0.current = performance.now() + lead + 4 * beatMs;
    setBeat(-4);
    phaseRef.current = 'run';
    setPhase('run');
  };
  const finish = () => {
    phaseRef.current = 'done';
    setPhase('done');
    const hits = matched.current.size;
    const extra = taps.current.length - hits;
    setMarks(onsets.map((_, i) => (matched.current.has(i) ? 'hit' : 'miss')));
    const ok = hits === onsets.length && extra <= 1;
    answer(ok, {
      title: ok ? 'No ritmo! 🥁' : undefined,
      text: ok ? undefined : taps.current.length === 0 ? 'Toque no tambor quando a contagem acabar!'
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
      if (b > length + 0.35) { clearInterval(id); finishRef.current(); }
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
  return (
    <div className="lx-body">
      <Prompt>Toque o tambor no ritmo!</Prompt>
      <div className="lx-rhythmbox"><RhythmView pattern={ex.pattern} active={active} marks={marks} /></div>
      {phase === 'ready' ? (
        <div className="lx-row">
          <button type="button" className="kids-btn kids-btn--listen" onClick={() => play(ex.pattern, ex.bpm)}>🔊 Ouvir o ritmo</button>
          <button type="button" className="kids-btn kids-btn--go" onClick={start}>▶ Começar</button>
        </div>
      ) : (
        <p className="lx-count" aria-live="polite">{counting ? Math.max(1, Math.min(4, Math.floor(beat) + 5)) : phase === 'run' ? 'Agora! 🥁' : ' '}</p>
      )}
      <button type="button" className={`lx-drum${phase === 'run' ? ' is-live' : ''}`} onPointerDown={e => { e.preventDefault(); sound.tap(); hit(); }} aria-label="Tambor">
        <span aria-hidden="true">🥁</span>
      </button>
    </div>
  );
}

function StaffIntroEx({ ex, answer, setKb, pressRef, sound, say }) {
  const info = noteInfo(ex.note);
  useEffect(() => { setKb({ mode: 'full', targets: [ex.note] }); }, []);
  useIntro(say, `${STAFF_TIPS[ex.note]} Toque o ${staffName(ex.note)}.`);
  useEffect(() => {
    pressRef.current = name => { if (samePitch(name, ex.note)) answer(true, { title: `Isso! ${staffName(ex.note)} na pauta!` }); };
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
      <p className="lx-hint">{STAFF_TIPS[ex.note]}</p>
    </div>
  );
}

function StaffPlayEx({ ex, answer, setKb, pressRef, say }) {
  useEffect(() => { setKb({ mode: 'full' }); }, []);
  useIntro(say, 'Que nota é essa na pauta? Toque no piano.');
  useEffect(() => {
    pressRef.current = name => {
      if (samePitch(name, ex.note)) { answer(true); return; }
      answer(false, { text: `Era o ${staffName(ex.note)}. ${STAFF_TIPS[ex.note]}`, reveal: [ex.note] });
    };
  });
  return (
    <div className="lx-body">
      <Prompt>Que nota é essa? Toque no piano!</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[ex.note]} current={0} /></div>
    </div>
  );
}

function StaffNameEx({ ex, answer, locked, setKb, sound, say }) {
  const correct = pitchClass(ex.note);
  const [picked, setPicked] = useState(null);
  useEffect(() => { setKb(null); }, []);
  useIntro(say, 'Qual é o nome desta nota?');
  return (
    <div className="lx-body">
      <Prompt>Qual é o nome desta nota?</Prompt>
      <div className="lx-staffbox"><MiniStaff notes={[ex.note]} current={0} /></div>
      <OptionButtons options={ex.options} correct={correct} picked={picked} locked={locked}
        onPick={pc => { setPicked(pc); sound.note(ex.note); answer(pc === correct, { text: `É o ${staffName(ex.note)}. ${STAFF_TIPS[ex.note]}`, okText: STAFF_TIPS[ex.note] }); }} />
    </div>
  );
}

function StaffSeqEx({ ex, answer, setKb, pressRef, say }) {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  useEffect(() => { setKb({ mode: 'full' }); }, []);
  useIntro(say, 'Leia a pauta e toque as notas, da esquerda para a direita.');
  useEffect(() => {
    pressRef.current = name => {
      const at = stepRef.current;
      if (samePitch(name, ex.notes[at])) {
        stepRef.current = at + 1;
        setStep(at + 1);
        if (at + 1 === ex.notes.length) answer(true, { title: 'Você leu a partitura! 📖' });
        return;
      }
      answer(false, { text: `Essa nota era o ${staffName(ex.notes[at])}. ${STAFF_TIPS[ex.notes[at]]}`, reveal: [ex.notes[at]] });
    };
  });
  return (
    <div className="lx-body">
      <Prompt>Leia e toque as notas, uma por uma 👉</Prompt>
      <div className="lx-staffbox lx-staffbox--wide"><MiniStaff notes={ex.notes} current={step} passed={step} /></div>
    </div>
  );
}

function WatchEx({ ex, answer, setKb, sound, say, demoBeat, demoPlaying }) {
  const song = songById(ex.song);
  const starts = useMemo(() => { let b = 0; return song.notes.map(([, d]) => { const s = b; b += d; return s; }); }, [song]);
  const [heard, setHeard] = useState(false);
  const wasPlaying = useRef(false);
  useEffect(() => { setKb({ mode: 'full' }); return () => sound.stopDemo(); }, []);
  useIntro(say, `Escute ${song.title} e olhe as teclas.`, () => sound.demo(song.notes, song.bpm));
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

function PhraseEx({ ex, answer, setKb, pressRef, say }) {
  const song = songById(ex.song);
  const notes = useMemo(() => song.notes.slice(ex.from, ex.to), [song, ex.from, ex.to]);
  const [index, setIndex] = useState(0);
  const [wiggle, setWiggle] = useState(null);
  const indexRef = useRef(0);
  useEffect(() => { setKb({ mode: 'full', targets: index < notes.length ? [kidKeyFor(notes[index][0])] : [] }); }, [index]);
  useIntro(say, ex.label === 'A música toda' || ex.label.includes('inteiro') ? 'Agora a música toda!' : `${ex.label}. Siga as cores!`);
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
  watch: WatchEx, phrase: PhraseEx,
};
// Exercises that only use buttons: the piano steps aside so the choices get the room.
const starsFor = mistakes => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

// ── Lesson runner ──────────────────────────────────────────────────────────

export default function KidsLesson({ lesson, unit, lit, sparks, pointerHandlers, pressRef, sound, say, demoBeat, demoPlaying, onQuit, onComplete }) {
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
      say(stars === 3 ? 'Lição completa! Sem nenhum erro!' : 'Lição completa! Muito bem!');
      return;
    }
    posRef.current = next;
    setPos(next);
  }, [lesson, pressRef, say, sound, total]);

  const answer = useCallback((ok, detail = {}) => {
    if (resultRef.current) return;
    if (ok) {
      setCorrect(c => c + 1);
      if (detail.silent) { advance(); return; }
      setCombo(c => c + 1);
      sound.jingle('success');
      const title = detail.title || praise();
      say(title.replace(/[^\p{L}\p{N}\s!?,.]/gu, ''));
      resultRef.current = { ok: true, title, text: detail.okText };
    } else {
      mistakesRef.current += 1;
      setCombo(0);
      // Like a good teacher: what went wrong comes back at the end of the lesson.
      const current = queueRef.current[posRef.current];
      queueRef.current = [...queueRef.current, { ...current, uid: `${current.uid}-again-${queueRef.current.length}` }];
      say('Quase!');
      resultRef.current = { ok: false, title: detail.title || 'Quase!', text: detail.text };
      if (detail.reveal) setKb(k => (k ? { ...k, targets: detail.reveal, marks: [], pointer: true } : k));
    }
    setResult(resultRef.current);
  }, [advance, say, sound]);

  // Enter (or space) continues after the feedback, like the button.
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
          <h2>Lição completa!</h2>
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
              pressRef={pressRef} sound={sound} say={say} demoBeat={demoBeat} demoPlaying={demoPlaying} />
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
        <KidsKeyboard lit={lit} sparks={sparks} pointerHandlers={pointerHandlers} mode={kb.mode}
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
