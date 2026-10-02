import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Confetti, DEFAULT_VOICE, KIDS_SONGS, KID_KEYS, KidsKeyboard, BubbleTrack, Mascot, NINA_HELLO, NOTE_INFO, Star, StarRow,
  VOICE_STYLES, WHITE_PCS, kidKeyFor, noteInfo, pitchClass, portugueseVoices, speak,
} from './kids/kidsShared.jsx';
import KidsLesson from './kids/KidsLesson.jsx';
import { PRACTICE } from './kids/curriculum.js';
import KidsPath, { currentStreak, dayKey } from './kids/KidsPath.jsx';
import './kids-mode.css';
import './kids/kids-path.css';

const FIND_ROUNDS = 10;
// Starts with three notes and adds more as the child gets going.
const findPool = round => (round < 4 ? ['C', 'D', 'E'] : round < 7 ? ['C', 'D', 'E', 'F', 'G'] : WHITE_PCS);
const pickNote = (pool, previous) => {
  const options = pool.filter(pc => pc !== previous);
  return options[Math.floor(Math.random() * options.length)];
};
const starsFor = (mistakes, ok, fine) => (mistakes <= ok ? 3 : mistakes <= fine ? 2 : 1);

const STORE_KEY = 'allegretto-kids';
function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch { return {}; }
}

function Celebration({ title, text, stars, onAgain, onBack, backLabel }) {
  return (
    <div className="kids-celebrate" role="dialog" aria-modal="true" aria-label={title}>
      <Confetti />
      <div className="kids-celebrate__card">
        <StarRow count={stars} animate />
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="kids-celebrate__actions">
          <button type="button" className="kids-btn kids-btn--go" onClick={onAgain}>↺ De novo</button>
          <button type="button" className="kids-btn" onClick={onBack}>{backLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Activities ─────────────────────────────────────────────────────────────

function Explore({ pressRef, say, onComplete }) {
  const [last, setLast] = useState(null);
  const [found, setFound] = useState(() => new Set());
  const foundRef = useRef(found);
  useEffect(() => {
    pressRef.current = name => {
      const info = noteInfo(name);
      setLast({ name, at: performance.now() });
      const pc = pitchClass(name);
      if (!NOTE_INFO[pc] || foundRef.current.has(pc)) return;
      // The voice only names a note the first time it's found; after that the card on screen is enough.
      say(`${info.name}, de ${info.word}!`);
      foundRef.current = new Set(foundRef.current).add(pc);
      setFound(foundRef.current);
      if (foundRef.current.size === WHITE_PCS.length) setTimeout(onComplete, 700);
    };
  });
  const info = last && noteInfo(last.name);
  return (
    <div className="kids-explore">
      <div className="kids-found" aria-label={`${found.size} de 7 notas descobertas`}>
        {WHITE_PCS.map(pc => (
          <span key={pc} className={found.has(pc) ? 'is-on' : undefined} style={{ '--c': NOTE_INFO[pc].color }}>
            {found.has(pc) ? NOTE_INFO[pc].emoji : '?'}
          </span>
        ))}
      </div>
      {info ? (
        <div key={last.at} className={`kids-bigcard${info.black ? ' is-black' : ''}`} style={{ '--c': info.color }} aria-live="polite">
          <span className="kids-bigcard__emoji" aria-hidden="true">{info.emoji}</span>
          <span className="kids-bigcard__text">
            <strong>{info.name}</strong>
            <small>{info.word ? <>de <em>{info.word}</em></> : 'tecla preta'}</small>
          </span>
        </div>
      ) : (
        <p className="kids-lead">Aperte as teclas coloridas e descubra as 7 notas! 🎹</p>
      )}
    </div>
  );
}

function FindGame({ pressRef, say, onTargets, onJingle, onFinish }) {
  const [round, setRound] = useState(0);
  const [goal, setGoal] = useState(() => pickNote(findPool(0), null));
  const [tries, setTries] = useState(0);
  const [state, setState] = useState('ask'); // ask | right
  const [shake, setShake] = useState(0);
  const missesRef = useRef(0);
  const timer = useRef(null);
  const info = NOTE_INFO[goal];

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { say(`Cadê o ${NOTE_INFO[goal].name}?`); }, [goal, round, say]);
  // After two wrong tries the right key starts to glow, so nobody gets stuck.
  useEffect(() => { onTargets(state === 'ask' && tries >= 2 ? goal : null); }, [state, tries, goal, onTargets]);

  useEffect(() => {
    pressRef.current = name => {
      if (state !== 'ask') return;
      if (pitchClass(name) !== goal) {
        missesRef.current += 1;
        setTries(t => t + 1);
        setShake(s => s + 1);
        return;
      }
      setState('right');
      onJingle('success');
      timer.current = setTimeout(() => {
        if (round + 1 >= FIND_ROUNDS) { onFinish(missesRef.current); return; }
        setRound(round + 1);
        setGoal(pickNote(findPool(round + 1), goal));
        setTries(0);
        setShake(0);
        setState('ask');
      }, 1100);
    };
  });

  return (
    <div className="kids-find">
      <div className="kids-rounds" aria-label={`Rodada ${round + 1} de ${FIND_ROUNDS}`}>
        {Array.from({ length: FIND_ROUNDS }, (_, i) => (
          <i key={i} className={i < round || (i === round && state === 'right') ? 'is-done' : i === round ? 'is-now' : undefined} />
        ))}
      </div>
      <div key={`${round}-${shake}`} className={`kids-ask${state === 'right' ? ' is-right' : shake ? ' is-wrong' : ''}`} style={{ '--c': info.color }} aria-live="polite">
        <span className="kids-ask__emoji" aria-hidden="true">{info.emoji}</span>
        <span className="kids-ask__text">
          <small>{state === 'right' ? 'Você achou o' : 'Cadê o'}</small>
          <strong>{info.name}{state === 'right' ? '!' : '?'}</strong>
        </span>
      </div>
      <p className="kids-tip">
        {state === 'right' ? '🎉 Muito bem!' : tries >= 2 ? 'Olha a tecla piscando! ✨' : tries === 1 ? 'Quase! Tente outra vez.' : 'Procure a tecla com a mesma cor.'}
      </p>
    </div>
  );
}

function SongList({ stars, onPick }) {
  return (
    <div className="kids-songs">
      {KIDS_SONGS.map(song => (
        <button type="button" key={song.id} className="kids-song" style={{ '--c': song.color }} onClick={() => onPick(song)}>
          <span className="kids-song__emoji" aria-hidden="true">{song.emoji}</span>
          <strong>{song.title}</strong>
          <StarRow count={stars[`song-${song.id}`] || 0} />
        </button>
      ))}
    </div>
  );
}

function SongPlay({ song, pressRef, onTargets, onDemo, onStopDemo, demoBeat, demoPlaying, onFinish }) {
  const { notes } = song;
  const starts = useMemo(() => {
    let beat = 0;
    return notes.map(([, dur]) => { const start = beat; beat += dur; return start; });
  }, [notes]);
  const [idx, setIdx] = useState(0);
  const [wiggle, setWiggle] = useState({ n: 0, at: -1 });
  const idxRef = useRef(0);
  const mistakesRef = useRef(0);
  const done = idx >= notes.length;
  // While "Ouvir" plays, the bubbles follow the music instead of the child.
  let demoIdx = -1;
  if (demoPlaying && demoBeat >= 0) for (let i = 0; i < starts.length && starts[i] <= demoBeat + 1e-6; i += 1) demoIdx = i;
  const viewIdx = demoIdx >= 0 ? demoIdx : idx;

  useEffect(() => { onTargets(!done && !demoPlaying ? notes[idx][0] : null); }, [idx, done, demoPlaying, notes, onTargets]);
  useEffect(() => {
    pressRef.current = name => {
      if (demoPlaying) return;
      const at = idxRef.current;
      if (at >= notes.length) return;
      if (pitchClass(name) !== pitchClass(notes[at][0])) {
        mistakesRef.current += 1;
        setWiggle(w => ({ n: w.n + 1, at }));
        return;
      }
      idxRef.current = at + 1;
      setIdx(at + 1);
      if (at + 1 >= notes.length) onFinish(mistakesRef.current);
    };
  });

  const restart = () => { onStopDemo(); idxRef.current = 0; mistakesRef.current = 0; setIdx(0); setWiggle({ n: 0, at: -1 }); };
  const pct = Math.round((Math.min(idx, notes.length) / notes.length) * 100);

  return (
    <div className="kids-play">
      <div className="kids-play__top">
        <h2><span aria-hidden="true">{song.emoji}</span> {song.title}</h2>
        <div className="kids-play__actions">
          <button type="button" className={`kids-btn${demoPlaying ? ' kids-btn--stop' : ' kids-btn--listen'}`} onClick={() => (demoPlaying ? onStopDemo() : onDemo(notes, song.bpm))}>
            {demoPlaying ? '⏹ Parar' : '👂 Ouvir'}
          </button>
          <button type="button" className="kids-btn" onClick={restart}>↺ Recomeçar</button>
        </div>
      </div>
      <div className="kids-path" aria-label={`${pct}% da música`}>
        <span className="kids-path__fill" style={{ width: `${pct}%`, background: song.color }} />
        <span className="kids-path__walker" style={{ left: `${pct}%` }} aria-hidden="true">{song.emoji}</span>
        <span className="kids-path__flag" aria-hidden="true">🏁</span>
      </div>
      <BubbleTrack notes={notes} index={viewIdx} wiggle={demoPlaying ? null : wiggle} />
      <p className="kids-tip">{demoPlaying ? 'Escute e veja as cores dançando 🎶' : 'Toque a tecla que está piscando!'}</p>
    </div>
  );
}

/** For the grown-ups: switch Nina's voice on or off, pick how she sounds and which of the browser's voices she uses. */
function VoicePanel({ voice, onChange, onClose }) {
  const [voices, setVoices] = useState(portugueseVoices);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  // Chrome fills in its voice list a moment after the page loads.
  useEffect(() => {
    if (!supported) return undefined;
    const refresh = () => setVoices(portugueseVoices());
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
  }, [supported]);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const change = patch => {
    const next = { ...voice, ...patch };
    onChange(next);
    // Every change says hello in the new voice, so the grown-up hears the difference right away.
    if (next.on) speak(NINA_HELLO, next);
    else window.speechSynthesis?.cancel();
  };
  return (
    <>
      <button type="button" className="kids-voice__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="kids-voice" role="dialog" aria-label="Voz da Nina">
        <div className="kids-voice__head">
          <Mascot size={48} mood={voice.on ? 'cheer' : 'happy'} />
          <strong>Voz da Nina</strong>
          <button type="button" className={`kids-switch${voice.on ? ' is-on' : ''}`} role="switch" aria-checked={voice.on}
            aria-label={voice.on ? 'Desligar a voz' : 'Ligar a voz'} onClick={() => change({ on: !voice.on })}>
            <i aria-hidden="true" />
          </button>
        </div>
        <div className={`kids-voice__body${voice.on ? '' : ' is-off'}`}>
          <span className="kids-voice__label">Jeito de falar</span>
          <div className="kids-voice__styles" role="group" aria-label="Jeito de falar">
            {Object.entries(VOICE_STYLES).map(([id, style]) => (
              <button type="button" key={id} aria-pressed={voice.style === id} disabled={!voice.on} onClick={() => change({ style: id })}>
                <span aria-hidden="true">{style.icon}</span>{style.label}
              </button>
            ))}
          </div>
          <label className="kids-voice__label" htmlFor="kids-voice-select">Qual voz</label>
          {voices.length ? (
            <select id="kids-voice-select" value={voice.voiceURI} disabled={!voice.on} onChange={e => change({ voiceURI: e.target.value })}>
              <option value="">Automática (a mais infantil)</option>
              {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name.replace(/^Microsoft /, '').replace(/ - Portuguese \(Brazil\)/i, '')}</option>)}
            </select>
          ) : (
            <p className="kids-voice__note">{supported ? 'Procurando vozes em português…' : 'Este navegador não tem voz.'} No Chrome ou no Edge a Nina fala melhor.</p>
          )}
          <button type="button" className="kids-btn kids-btn--listen kids-voice__test" disabled={!voice.on} onClick={() => speak(NINA_HELLO, voice)}>▶ Ouvir a Nina</button>
          <p className="kids-voice__note">Cada voz soa de um jeito; teste e escolha a que a criança mais gostar.</p>
        </div>
      </div>
    </>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────

const EMPTY_PATH = { done: {}, xp: 0, streak: { count: 0, last: null }, today: { day: null, count: 0 }, unlockAll: false };
const SCREEN_TITLES = { explore: 'Descobrir', find: 'Achar a nota', songs: 'Músicas', play: 'Músicas' };

export default function KidsMode({ activeNotes, pressHookRef, pointerHandlers, onSound, onDemo, onStopDemo, demoBeat, demoPlaying, onJingle, onClose }) {
  const [screen, setScreen] = useState('path'); // path | home | explore | find | songs | play
  const [lesson, setLesson] = useState(null);   // { lesson, unit } while a lesson runs
  const [song, setSong] = useState(null);
  const [voice, setVoice] = useState(() => {
    const saved = readStore();
    return { ...DEFAULT_VOICE, ...saved.voiceSettings, on: saved.voice !== false };
  });
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [stars, setStars] = useState(() => readStore().stars || {});
  const [path, setPath] = useState(() => ({ ...EMPTY_PATH, ...readStore().path }));
  const [targetNote, setTargetNote] = useState(null);
  const [sparks, setSparks] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [round, setRound] = useState(0); // remounts an activity to play it again
  const activityPress = useRef(null);
  const sparkId = useRef(0);

  useEffect(() => {
    const voiceSettings = { style: voice.style, voiceURI: voice.voiceURI };
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ voice: voice.on, voiceSettings, stars, path })); } catch { /* private mode */ }
  }, [voice, stars, path]);
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);
  // The page behind shouldn't scroll under small fingers.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous; };
  }, []);

  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  const say = useMemo(() => text => speak(text, voiceRef.current), []);
  const onTargets = useMemo(() => note => setTargetNote(note), []);
  // What lessons may play: single notes, sequences (sound only, keys stay dark), the drum, jingles and lit-up demos.
  const sound = useMemo(() => ({
    note: name => onSound([[name, 1.2]], 100),
    seq: (seq, bpm) => onSound(seq, bpm),
    tap: () => onSound([['G3', 0.2, 0.9]], 200),
    jingle: kind => onJingle(kind),
    demo: (notes, bpm) => onDemo(notes, bpm),
    stopDemo: () => onStopDemo(),
  }), [onSound, onJingle, onDemo, onStopDemo]);

  useEffect(() => {
    pressHookRef.current = name => {
      const id = ++sparkId.current;
      const glyph = ['♪', '♫', '♩', '★'][id % 4];
      setSparks(list => [...list.slice(-10), { id, note: name, glyph }]);
      setTimeout(() => setSparks(list => list.filter(s => s.id !== id)), 900);
      if (!celebration) activityPress.current?.(name);
    };
    return () => { pressHookRef.current = null; };
  }, [pressHookRef, celebration]);

  const award = (id, n) => setStars(prev => ((prev[id] || 0) >= n ? prev : { ...prev, [id]: n }));
  const total = Object.values(stars).reduce((sum, n) => sum + n, 0);
  const streak = currentStreak(path);

  const go = next => {
    onStopDemo();
    activityPress.current = null;
    setTargetNote(null);
    setCelebration(null);
    setRound(r => r + 1);
    setScreen(next);
  };
  const back = () => go(screen === 'play' ? 'songs' : 'home');
  const celebrate = ({ id, stars: n, title, text, backTo, backLabel }) => {
    award(id, n);
    setTargetNote(null);
    onJingle('fanfare');
    speak(n === 3 ? 'Parabéns! Três estrelas!' : 'Parabéns!', voiceRef.current);
    setCelebration({ title, text, stars: n, again: () => go(screen), back: () => go(backTo), backLabel });
  };
  const startLesson = (picked, unit) => {
    onStopDemo();
    activityPress.current = null;
    setRound(r => r + 1);
    setLesson({ lesson: picked, unit });
  };
  const leaveLesson = () => {
    onStopDemo();
    activityPress.current = null;
    setLesson(null);
  };
  const finishLesson = ({ stars: earned, xp }) => {
    const { id, practice } = lesson.lesson;
    setPath(prev => {
      const today = dayKey();
      const last = prev.streak?.last;
      const kept = last === today ? prev.streak : { count: last === dayKey(-1) ? (prev.streak?.count || 0) + 1 : 1, last: today };
      return {
        ...prev,
        // Free practice earns XP and keeps the streak, but doesn't tick off a lesson on the path.
        done: practice ? prev.done : { ...prev.done, [id]: Math.max(prev.done?.[id] || 0, earned) },
        xp: (prev.xp || 0) + xp,
        streak: kept,
        today: { day: today, count: (prev.today?.day === today ? prev.today.count : 0) + 1 },
      };
    });
    leaveLesson();
  };

  const targets = new Set();
  if (targetNote) {
    if (/\d/.test(targetNote)) targets.add(kidKeyFor(targetNote));
    else KID_KEYS.forEach(name => { if (pitchClass(name) === targetNote) targets.add(name); });
  }

  if (lesson) {
    return (
      <div className="kids-mode" role="dialog" aria-modal="true" aria-label={`Lição: ${lesson.lesson.title}`}>
        <KidsLesson key={round} lesson={lesson.lesson} unit={lesson.unit} active={activeNotes} sparks={sparks} pointerHandlers={pointerHandlers}
          pressRef={activityPress} sound={sound} say={say} demoBeat={demoBeat} demoPlaying={demoPlaying}
          onQuit={leaveLesson} onComplete={finishLesson} />
      </div>
    );
  }

  const inTabs = screen === 'path' || screen === 'home';
  return (
    <div className="kids-mode" role="dialog" aria-modal="true" aria-label="Modo Infantil">
      <header className="kids-header">
        <button type="button" className="kids-btn kids-btn--small" onClick={inTabs ? onClose : back}>
          {inTabs ? '✕ Sair' : '← Voltar'}
        </button>
        {inTabs ? (
          <nav className="kids-tabs" aria-label="Seções do Modo Infantil">
            <button type="button" aria-pressed={screen === 'path'} onClick={() => go('path')}><span aria-hidden="true">🗺️</span> Trilha</button>
            <button type="button" aria-pressed={screen === 'home'} onClick={() => go('home')}><span aria-hidden="true">🎹</span> Brincar</button>
          </nav>
        ) : (
          <div className="kids-brand">{SCREEN_TITLES[screen]}</div>
        )}
        <div className="kids-header__right">
          {screen === 'path' ? (
            <>
              <span className="kids-starcount" title="Dias seguidos" aria-label={`${streak} dias seguidos`}><span aria-hidden="true">🔥</span> {streak}</span>
              <span className="kids-starcount kids-starcount--xp" title="Pontos de experiência" aria-label={`${path.xp} pontos de experiência`}><span aria-hidden="true">⚡</span> {path.xp}</span>
            </>
          ) : (
            <span className="kids-starcount" aria-label={`${total} estrelas`}><Star on /> {total}</span>
          )}
          <button type="button" className="kids-btn kids-btn--small kids-btn--round" aria-haspopup="dialog" aria-expanded={voiceOpen}
            aria-label="Voz da Nina" title={voice.on ? 'Voz ligada' : 'Voz desligada'} onClick={() => setVoiceOpen(o => !o)}>
            {voice.on ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <main className={`kids-stage${screen === 'path' ? ' kids-stage--path' : ''}`}>
        {screen === 'path' && (
          <KidsPath path={path} onStart={startLesson} onUnlockAll={() => setPath(p => ({ ...p, unlockAll: !p.unlockAll }))} />
        )}
        {screen === 'home' && (
          <div className="kids-home">
            <h1>Vamos brincar? <span aria-hidden="true">🎶</span></h1>
            <div className="kids-cards">
              <button type="button" className="kids-card" style={{ '--c': '#ffb020' }} onClick={() => go('explore')}>
                <span className="kids-card__art" aria-hidden="true">🎹</span>
                <strong>Descobrir</strong>
                <span>Conheça as notas, as cores e os bichinhos</span>
                <StarRow count={stars.explore || 0} />
              </button>
              <button type="button" className="kids-card" style={{ '--c': '#22b8d6' }} onClick={() => go('find')}>
                <span className="kids-card__art" aria-hidden="true">🔍</span>
                <strong>Achar a nota</strong>
                <span>Encontre a tecla certa em 10 rodadas</span>
                <StarRow count={stars.find || 0} />
              </button>
              <button type="button" className="kids-card" style={{ '--c': '#b065f0' }} onClick={() => go('songs')}>
                <span className="kids-card__art" aria-hidden="true">🎵</span>
                <strong>Músicas</strong>
                <span>Toque seguindo as cores, uma nota por vez</span>
                <StarRow count={Math.round(KIDS_SONGS.reduce((sum, s) => sum + (stars[`song-${s.id}`] || 0), 0) / KIDS_SONGS.length)} />
              </button>
            </div>
            <h2 className="kids-subhead">Treinos rápidos</h2>
            <div className="kids-cards kids-cards--two">
              {[PRACTICE.reading, PRACTICE.scales].map(practice => (
                <button type="button" key={practice.id} className="kids-card kids-card--row" style={{ '--c': practice.unit.color }} onClick={() => startLesson(practice, practice.unit)}>
                  <span className="kids-card__art" aria-hidden="true">{practice.icon}</span>
                  <strong>{practice.title}</strong>
                  <span>{practice.id === 'practice-reading' ? 'Notas na pauta, linhas e espaços e pedaços de músicas' : 'Escadas subindo e descendo, notas que faltam e vizinhos'}</span>
                </button>
              ))}
            </div>
            <p className="kids-parents">
              <strong>Para os adultos:</strong> funciona com toque na tela, mouse, teclado do computador (<kbd>Z</kbd> a <kbd>Q</kbd>) e teclado MIDI.
              Estrelas e progresso ficam salvos neste aparelho. Modo Infantil criado por Carlos Eduardo.
            </p>
          </div>
        )}

        {screen === 'explore' && (
          <Explore key={round} pressRef={activityPress} say={say}
            onComplete={() => celebrate({ id: 'explore', stars: 3, title: 'Você conhece as 7 notas!', text: 'Dó, Ré, Mi, Fá, Sol, Lá e Si. Agora tente achar cada uma.', backTo: 'home', backLabel: 'Outras brincadeiras' })} />
        )}
        {screen === 'find' && (
          <FindGame key={round} pressRef={activityPress} say={say} onTargets={onTargets} onJingle={onJingle}
            onFinish={misses => celebrate({ id: 'find', stars: starsFor(misses, 1, 4), title: 'Você achou todas!', text: misses === 0 ? 'Sem errar nenhuma. Que ouvido!' : `Dez notas encontradas, com ${misses} ${misses === 1 ? 'tentativa extra' : 'tentativas extras'}.`, backTo: 'home', backLabel: 'Outras brincadeiras' })} />
        )}
        {screen === 'songs' && (
          <div className="kids-songlist">
            <h1>Escolha uma música</h1>
            <SongList stars={stars} onPick={picked => { setSong(picked); go('play'); }} />
          </div>
        )}
        {screen === 'play' && song && (
          <SongPlay key={`${song.id}-${round}`} song={song} pressRef={activityPress} onTargets={onTargets}
            onDemo={onDemo} onStopDemo={onStopDemo} demoBeat={demoBeat} demoPlaying={demoPlaying}
            onFinish={mistakes => celebrate({ id: `song-${song.id}`, stars: starsFor(mistakes, 2, 6), title: `Você tocou ${song.title}!`, text: mistakes === 0 ? 'Todas as notas certinhas!' : 'Cada vez que você toca, fica mais fácil.', backTo: 'songs', backLabel: 'Outras músicas' })} />
        )}
      </main>

      {screen !== 'path' && <KidsKeyboard active={activeNotes} targets={targets} pointerHandlers={pointerHandlers} sparks={sparks} />}

      {voiceOpen && <VoicePanel voice={voice} onChange={setVoice} onClose={() => setVoiceOpen(false)} />}

      {celebration && (
        <Celebration title={celebration.title} text={celebration.text} stars={celebration.stars}
          onAgain={celebration.again} onBack={celebration.back} backLabel={celebration.backLabel} />
      )}
    </div>
  );
}
