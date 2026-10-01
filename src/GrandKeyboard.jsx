import { lighten } from './FreeModeStage.jsx';
import './grand-piano.css';

const DEFAULT_TINT = '#d4b06a';

const tintVars = tint => ({ '--tint': tint, '--tint-soft': lighten(tint, 0.8), '--tint-mid': lighten(tint, 0.42) });

function keyClass(base, state) {
  return `${base}${state.pressed ? ' is-pressed' : ''}${state.lit ? ' is-lit' : ''}${state.expected ? ' is-expected' : ''}`;
}

/**
 * Ivory/ebony keyboard drawn with real depth: felt shadow, front lip, ebony top face and bevel.
 * The caller owns geometry and behavior: `keyState(note)` → { pressed, lit, tint, expected } and
 * `handlersFor(note)` → pointer handlers, so lessons, multiplayer and the composer keep their logic.
 */
export default function GrandKeyboard({
  whiteKeys, blackKeys, blackLeft, blackWidth, keyState, handlersFor,
  showLabels = true, showHints = false, labelLang = 'pt', counts,
}) {
  const renderInner = (note, count) => (
    <>
      {count > 0 && <span className="gk-count">{count}</span>}
      {showLabels && <span className="gk-label">{labelLang === 'pt' ? note.pt : note.en}</span>}
      {showHints && <span className="gk-hint">{note.key.toUpperCase()}</span>}
    </>
  );

  return (
    <div className="gk">
      <div className="gk__whites">
        {whiteKeys.map(note => {
          const state = keyState(note);
          return (
            <button key={note.name} type="button" aria-label={`${note.pt} (${note.name})`}
              className={keyClass('gk-white', state)}
              style={state.lit ? tintVars(state.tint || DEFAULT_TINT) : undefined}
              {...handlersFor(note)}>
              {renderInner(note, counts?.get(note.name) || 0)}
            </button>
          );
        })}
      </div>
      {blackKeys.map(note => {
        const state = keyState(note);
        return (
          <button key={note.name} type="button" aria-label={`${note.pt} (${note.name})`}
            className={keyClass('gk-black', state)}
            style={{ left: `${blackLeft(note)}%`, width: `${blackWidth}%`, ...(state.lit ? tintVars(state.tint || DEFAULT_TINT) : null) }}
            {...handlersFor(note)}>
            {renderInner(note, counts?.get(note.name) || 0)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Lacquered grand-piano case around the keys: fallboard with the gold signature, felt, cheek blocks, key slip.
 * `fallboard` renders over the lacquer (e.g. reflections of what is on stage).
 */
export function GrandCase({ children, fallboard }) {
  return (
    <>
      <div className="grand__fallboard" aria-hidden="true"><span className="grand__logo">Allegretto</span>{fallboard}</div>
      <div className="grand__keybed">
        <span className="grand__cheek grand__cheek--left" aria-hidden="true" />
        <div className="grand__keys">
          <div className="grand__felt" aria-hidden="true" />
          {children}
        </div>
        <span className="grand__cheek grand__cheek--right" aria-hidden="true" />
      </div>
      <div className="grand__keyslip" aria-hidden="true" />
    </>
  );
}
