import {
  ArrowDown, ArrowUpRight, AudioLines, Check, ChevronRight, Headphones, Keyboard,
  MousePointerClick, Music2, Radio, Sparkles, Upload, Usb, Users, Volume2, VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import './studio.css';

const DIFFICULTY = ['', 'Iniciante', 'Intermediário', 'Avançado'];
const ROMAN = ['I', 'II', 'III', 'IV'];

// Featured songs on the "Programa" card, easiest first. Ids must exist in SONGS.
const FEATURED = ['twinkle', 'asabranca', 'elise', 'river_flows'];

function DifficultyMarks({ level }) {
  return (
    <span className="difficulty" aria-label={DIFFICULTY[level]}>
      {[1, 2, 3].map(step => <i key={step} className={step <= level ? 'on' : ''} />)}
    </span>
  );
}

export function StudioHeader({ midiInfo, audioReady, onAudio, onPlay, onLibrary, onModes, onKids, onRoom, inRoom, roomCode, memberCount }) {
  return (
    <header className="studio-header">
      <div className="studio-header__inner">
        <a className="brand" href="#top" aria-label="Allegretto, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span className="brand-name">Allegretto</span>
        </a>

        <nav className="header-nav" aria-label="Navegação principal">
          <button onClick={onPlay}>Tocar</button>
          <button onClick={onLibrary}>Repertório</button>
          <button onClick={onModes}>Modos</button>
          <button onClick={onKids}>Infantil</button>
          <button onClick={onRoom}>Ao vivo</button>
        </nav>

        <div className="header-actions">
          {inRoom && (
            <button className="room-pill" onClick={onRoom}>
              <span className="live-dot" aria-hidden="true" />
              <Users size={13} /> {roomCode} · {memberCount}
            </button>
          )}
          <span className="midi-pill" title={midiInfo.sub ? `${midiInfo.label}: ${midiInfo.sub}` : midiInfo.label}>
            <span className="midi-pill__dot" style={{ background: midiInfo.dot }} aria-hidden="true" />
            <Usb size={13} />
            <span className="midi-pill__label">{midiInfo.label}</span>
          </span>
          {audioReady ? (
            <span className="audio-status" role="status"><span className="live-dot" aria-hidden="true" /> Som ativo</span>
          ) : (
            <button className="audio-button" onClick={onAudio}><Volume2 size={14} /> Ativar som</button>
          )}
        </div>
      </div>
    </header>
  );
}

export function StudioHero({ songs, songCount, currentSongId, onSelect, onPlay, onLibrary }) {
  return (
    <section className="studio-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Piano de cauda · no seu navegador</p>
        <h1 id="hero-title">A música começa<br />com <em>um toque.</em></h1>
        <p className="hero-lede">
          Aprenda peças nota por nota, treine no ritmo, leia partitura de verdade — ou simplesmente toque.
          No teclado do computador, no toque da tela ou num teclado MIDI.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onPlay}>Começar a tocar <ArrowDown size={16} /></button>
          <button className="ghost-button" onClick={onLibrary}>Ver o repertório</button>
        </div>
        <ul className="hero-facts" aria-label="Destaques">
          <li><strong>{songCount}</strong> peças</li>
          <li><strong>5</strong> modos</li>
          <li><strong>6</strong> timbres</li>
          <li className="hero-facts__note"><Headphones size={14} /> Melhor de fone</li>
        </ul>
      </div>

      <div className="programme" aria-labelledby="programme-title">
        <p className="eyebrow eyebrow--centered">Programa</p>
        <h2 id="programme-title">Qual vai ser a próxima?</h2>
        <ol className="programme__list">
          {FEATURED.map((id, index) => {
            const song = songs.find(s => s.id === id);
            if (!song) return null;
            const isCurrent = currentSongId === id;
            return (
              <li key={id}>
                <button className={`programme-item${isCurrent ? ' is-current' : ''}`} onClick={() => onSelect(song)} aria-current={isCurrent ? 'true' : undefined}>
                  <span className="programme-item__numeral" aria-hidden="true">{ROMAN[index]}.</span>
                  <span className="programme-item__body">
                    <span className="programme-item__line">
                      <strong>{song.title}</strong>
                      <span className="programme-item__leader" aria-hidden="true" />
                      {isCurrent ? <em>Tocando agora</em> : <DifficultyMarks level={song.difficulty} />}
                    </span>
                    <span className="programme-item__composer">{song.artist} · {DIFFICULTY[song.difficulty]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button className="programme__all" onClick={onLibrary}>
          Repertório completo · {songCount} peças <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}

/** Control desk on top of the piano case; `screen` is rendered in the middle like a display. */
export function InstrumentDeck({ instruments, instrumentId, onInstrument, volume, onVolume, reverb, onReverb, brightness, onBrightness, sustain, onSustain, screen }) {
  const sliders = [
    { id: 'volume', label: 'Volume', value: volume, onChange: onVolume, icon: volume === 0 ? VolumeX : Volume2 },
    { id: 'reverb', label: 'Ambiência', value: reverb, onChange: onReverb, icon: AudioLines },
    { id: 'brightness', label: 'Brilho', value: brightness, onChange: onBrightness, icon: Sparkles },
  ];
  return (
    <div className="deck">
      <div className="deck__timbre">
        <span className="deck-label" id="timbre-label">Timbre</span>
        <div className="instrument-grid" role="group" aria-labelledby="timbre-label">
          {instruments.map(instrument => (
            <button key={instrument.id} className={instrumentId === instrument.id ? 'selected' : ''} aria-pressed={instrumentId === instrument.id} onClick={() => onInstrument(instrument.id)}>
              {instrument.label}
            </button>
          ))}
        </div>
        <button className="sustain-control" role="switch" aria-checked={sustain} onClick={() => onSustain(!sustain)}>
          <span><strong>Pedal de sustain</strong><small>Deixe as notas respirarem</small></span>
          <span className={`toggle${sustain ? ' on' : ''}`} aria-hidden="true"><i /></span>
        </button>
      </div>

      <div className="deck__screen">{screen}</div>

      <div className="deck__mix">
        <span className="deck-label">Mixagem</span>
        {sliders.map(slider => (
          <div className="sound-control" key={slider.id}>
            <label htmlFor={slider.id}>
              <slider.icon size={13} />{slider.label}
              <output htmlFor={slider.id}>{Math.round(slider.value * 100)}<small>%</small></output>
            </label>
            <input id={slider.id} type="range" min="0" max="100" value={Math.round(slider.value * 100)}
              onChange={e => slider.onChange(Number(e.target.value) / 100)} style={{ '--range-fill': `${slider.value * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardToolbar({ labels, onLabels, hints, onHints, labelLang, onLanguage, onFreeMode }) {
  return (
    <div className="keyboard-toolbar">
      <div className="toolbar-toggles" role="group" aria-label="O que mostrar nas teclas">
        <span className="toolbar-label">Nas teclas</span>
        <button className={labels ? 'selected' : ''} aria-pressed={labels} onClick={onLabels}><Music2 size={12} /> Notas {labels && <Check size={11} />}</button>
        <button className={hints ? 'selected' : ''} aria-pressed={hints} onClick={onHints}><Keyboard size={12} /> Atalhos {hints && <Check size={11} />}</button>
        <button onClick={onLanguage} aria-label="Alternar idioma das notas">{labelLang === 'pt' ? 'Dó Ré Mi' : 'C D E'}</button>
      </div>
      <button className="free-mode-button" onClick={onFreeMode}><Sparkles size={13} /> Modo Livre <ArrowUpRight size={13} /></button>
      <div className="input-hints" aria-label="Formas de tocar">
        <span><Usb size={12} /> MIDI</span>
        <span><Keyboard size={12} /> Teclado</span>
        <span><MousePointerClick size={12} /> Toque</span>
      </div>
    </div>
  );
}

export function ModesSection({ onLibrary, onFreeMode }) {
  const modes = [
    { title: 'Aprender', desc: 'A próxima nota brilha em dourado e espera por você. Sem pressa, sem cronômetro.', action: 'Escolher peça', onClick: onLibrary },
    { title: 'Treino', desc: 'As notas descem até as teclas. Acerte no tempo certo, encadeie combos, multiplique os pontos.', action: 'Escolher peça', onClick: onLibrary },
    { title: 'Partitura', desc: 'A pauta corre em tempo real. Toque cada nota quando ela cruzar a linha dourada.', action: 'Escolher peça', onClick: onLibrary },
    { title: 'Modo Livre', desc: 'O palco é seu: cada nota vira luz e cada acorde ganha nome. Feito para improvisar.', action: 'Abrir o palco', onClick: onFreeMode },
  ];
  const inputs = [
    { icon: Usb, title: 'Teclado MIDI', desc: 'Conecte via USB: detectado sozinho, com intensidade e pedal.' },
    { icon: Keyboard, title: 'Teclado do computador', desc: <>Brancas <kbd>Z</kbd>–<kbd>M</kbd> e <kbd>Q</kbd>–<kbd>I</kbd> · pretas <kbd>S</kbd> <kbd>D</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> e <kbd>2</kbd> <kbd>3</kbd> <kbd>5</kbd> <kbd>6</kbd> <kbd>7</kbd></> },
    { icon: MousePointerClick, title: 'Mouse e toque', desc: 'Clique ou toque nas teclas; vários dedos ao mesmo tempo funcionam.' },
  ];
  return (
    <section className="modes" id="modos" aria-labelledby="modes-title">
      <div className="section-heading">
        <p className="eyebrow eyebrow--centered">Modos</p>
        <h2 id="modes-title">Quatro maneiras de tocar</h2>
      </div>
      <div className="modes__grid">
        {modes.map((mode, index) => (
          <article className="mode-card" key={mode.title}>
            <span className="mode-card__numeral" aria-hidden="true">{ROMAN[index]}</span>
            <h3>{mode.title}</h3>
            <p>{mode.desc}</p>
            <button onClick={mode.onClick}>{mode.action} <ChevronRight size={14} /></button>
          </article>
        ))}
      </div>
      <div className="inputs__grid">
        {inputs.map(input => (
          <div className="input-card" key={input.title}>
            <span className="input-card__icon"><input.icon size={16} /></span>
            <div><h3>{input.title}</h3><p>{input.desc}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Colors and pictures of the Modo Infantil keys (NOTE_INFO in KidsMode.jsx), Dó to Dó.
const KIDS_KEYS = [
  ['Dó', '🍬', '#ff5d5d'], ['Ré', '👑', '#ff9a3c'], ['Mi', '🐱', '#ffc928'], ['Fá', '🧚', '#43c96b'],
  ['Sol', '☀️', '#22b8d6'], ['Lá', '🧶', '#5b7cfa'], ['Si', '🔔', '#b065f0'], ['Dó', '🍬', '#ff5d5d'],
];

/** Invitation to the kids' room: the one colorful corner of the concert hall. */
export function KidsInvite({ onOpen }) {
  return (
    <section className="kids-invite" aria-labelledby="kids-invite-title">
      <div className="kids-invite__copy">
        <p className="eyebrow">Para os pequenos</p>
        <h2 id="kids-invite-title">Modo <em>Infantil</em></h2>
        <p>
          Teclas grandes e coloridas, cada nota com seu bichinho e uma voz que diz o nome dela.
          Brincadeiras para conhecer as notas, um jogo de achar a tecla e músicas para tocar seguindo as cores, sem pressa.
        </p>
        <button className="primary-button" onClick={onOpen}>Abrir o Modo Infantil <ArrowUpRight size={16} /></button>
      </div>
      <div className="kids-invite__art" aria-hidden="true">
        {KIDS_KEYS.map(([name, emoji, color], index) => (
          <span key={index} className="kids-invite__key" style={{ '--c': color, '--i': index }}>
            <i>{emoji}</i><b>{name}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

// Same palette multiplayer uses for player colors (nameToColor in PianoMidi.jsx).
const LIVE_COLORS = ['#9bd17e', '#7bb3f0', '#e07c5e', '#c77ee0', '#d4b06a'];
// One lit key per avatar, so each musician sits above the key they are playing.
const LIT_KEYS = [1, 4, 7, 9, 12];
const LIVE_KEY_COUNT = 14;
// Two octaves from C: a black key follows C, D, F, G and A.
const LIVE_BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];

export function LiveBand({ onRoom, inRoom, roomCode }) {
  return (
    <section className="live-band" aria-labelledby="live-title">
      <div className="live-band__copy">
        <p className="eyebrow"><Radio size={12} /> Ao vivo</p>
        <h2 id="live-title">Toque a quatro mãos, <em>de qualquer lugar.</em></h2>
        <p>Crie uma sala, envie o código e toquem juntos em tempo real. Cada músico ganha uma cor nas teclas, e o som nasce no aparelho de cada um — sem atraso de streaming.</p>
        <button className="primary-button" onClick={onRoom}>
          {inRoom ? <>Abrir sala {roomCode}</> : <>Criar ou entrar numa sala</>} <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="live-band__art" aria-hidden="true">
        {LIVE_COLORS.map((color, index) => (
          <span key={color} className="live-avatar" style={{ '--avatar': color, '--i': index, left: `calc(${((LIT_KEYS[index] + 0.5) / LIVE_KEY_COUNT) * 100}% - 21px)`, top: index % 2 ? '30%' : '6%' }}><Music2 size={15} /></span>
        ))}
        <div className="live-keys">
          <div className="live-keys__row">
            {Array.from({ length: LIVE_KEY_COUNT }, (_, index) => {
              const lit = LIT_KEYS.indexOf(index);
              return <i key={index} className={lit >= 0 ? 'lit' : undefined} style={lit >= 0 ? { '--lit': LIVE_COLORS[lit] } : undefined} />;
            })}
            {LIVE_BLACK_AFTER.map(index => <b key={index} style={{ left: `${((index + 1) / LIVE_KEY_COUNT) * 100}%` }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

const songSeconds = song => {
  const beats = song.notes.reduce((sum, n) => sum + (Array.isArray(n) ? n[1] : 1), 0);
  return Math.round(beats / ((song.bpm || 90) / 60));
};

/** Song picker inside Free Mode: put any song on stage (and, in a room, on everyone's stage). */
export function FreeSongPicker({ songs, customSongs, inRoom, onPick, onImport, onClose }) {
  const row = (song, tag) => {
    const secs = songSeconds(song);
    return (
      <li key={song.id}>
        <button className="picker-song" onClick={() => onPick(song)}>
          <span className="picker-song__body">
            <strong>{song.title}</strong>
            <span>{song.artist} · {song.notes.length} notas · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          </span>
          {tag ? <em className="picker-song__tag">{tag}</em> : <DifficultyMarks level={song.difficulty || 1} />}
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </li>
    );
  };
  return (
    <div className="import-backdrop picker-backdrop" role="presentation" onClick={onClose}>
      <div className="import-dialog picker" role="dialog" aria-modal="true" aria-labelledby="picker-title"
        onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
        <p className="eyebrow eyebrow--centered">Músicas</p>
        <h2 id="picker-title">O que vamos tocar?</h2>
        <p className="import-dialog__note">
          {inRoom ? 'Todos na sala recebem a música — e quando alguém aperta Acompanhar, todos começam juntos.' : 'A música vai para o palco: ouça, acompanhe as notas caindo ou edite.'}
        </p>
        <button className="ghost-button picker__import" onClick={onImport} autoFocus><Upload size={14} /> Importar MIDI</button>
        <div className="picker__lists">
          {customSongs.length > 0 && (
            <>
              <p className="picker__group">Suas músicas</p>
              <ul>{customSongs.map(song => row(song, song.source === 'midi' ? 'MIDI' : 'Sua'))}</ul>
            </>
          )}
          <p className="picker__group">Repertório</p>
          <ul>{songs.map(song => row(song))}</ul>
        </div>
        <div className="import-dialog__actions">
          <button className="ghost-button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/** Review step after reading a MIDI file: shows what was extracted and lets the player rename it. */
export function MidiImportDialog({ result, onConfirm, onCancel, onRetry }) {
  const [title, setTitle] = useState(result.song?.title ?? '');
  const [artist, setArtist] = useState(result.song?.artist ?? '');
  const { song, report } = result;
  const minutes = report ? `${Math.floor(report.seconds / 60)}:${String(report.seconds % 60).padStart(2, '0')}` : '';
  const octaves = report ? Math.abs(report.octaveShift) : 0;
  return (
    <div className="import-backdrop" role="presentation" onClick={onCancel}>
      <div className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title"
        onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}>
        <p className="eyebrow eyebrow--centered">Importar MIDI</p>
        {result.error ? (
          <>
            <h2 id="import-title">Não deu para importar</h2>
            <p className="import-dialog__note">{result.error}</p>
            <div className="import-dialog__actions">
              <button className="ghost-button" onClick={onCancel}>Fechar</button>
              <button className="primary-button" onClick={onRetry} autoFocus>Escolher outro arquivo</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="import-title">Pronta para o repertório</h2>
            <label className="import-field">Título
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} autoFocus />
            </label>
            <label className="import-field">Artista
              <input value={artist} onChange={e => setArtist(e.target.value)} maxLength={60} />
            </label>
            <dl className="import-facts">
              <div><dt>Notas</dt><dd>{report.melodyNotes}</dd></div>
              <div><dt>Andamento</dt><dd>{song.bpm}<small> BPM</small></dd></div>
              <div><dt>Compasso</dt><dd>{song.timeSignature}</dd></div>
              <div><dt>Duração</dt><dd>{minutes}</dd></div>
            </dl>
            <p className="import-dialog__note">
              Melodia extraída das {report.sourceNotes} notas do arquivo
              {octaves > 0 && <>, transposta {octaves} oitava{octaves > 1 ? 's' : ''} para {report.octaveShift < 0 ? 'baixo' : 'cima'}</>}
              {report.folded > 0 && <>; {report.folded} nota{report.folded > 1 ? 's' : ''} fora das 25 teclas {report.folded > 1 ? 'foram trazidas' : 'foi trazida'} para dentro</>}.
              {' '}
              {report.bassNotes > 0
                ? <>Mão esquerda: <strong>{report.bassNotes} notas</strong> na clave de fá{report.bassStartMeasure > 2 && <>, entrando no compasso {report.bassStartMeasure}</>}.</>
                : <>Este arquivo não tem mão esquerda (nada abaixo do Dó central).</>}
            </p>
            <div className="import-dialog__actions">
              <button className="ghost-button" onClick={onCancel}>Cancelar</button>
              <button className="primary-button" disabled={!title.trim()} onClick={() => onConfirm({ title: title.trim(), artist: artist.trim() || 'MIDI importado' })}>
                Adicionar e tocar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function StudioFooter({ songCount }) {
  return (
    <footer className="studio-footer">
      <span className="brand-mark" aria-hidden="true">A</span>
      <span className="studio-footer__name">Allegretto</span>
      <span className="studio-footer__meta">Piano de cauda no navegador · {songCount} peças · Tone.js, Web MIDI e WebRTC</span>
      <span className="studio-footer__credit">Criado por <strong>Carlos Eduardo</strong></span>
    </footer>
  );
}
