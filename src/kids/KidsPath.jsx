import { useEffect, useRef } from 'react';
import { Mascot, StarRow } from './kidsShared.jsx';
import { ALL_LESSONS, UNITS } from './curriculum.js';

export const DAILY_GOAL = 2;

/** Local calendar day as YYYY-MM-DD, `offset` days from today. */
export function dayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Days in a row with at least one lesson; still alive until the end of the day after the last one. */
export function currentStreak(path) {
  const last = path.streak?.last;
  return last === dayKey() || last === dayKey(-1) ? path.streak.count : 0;
}

function DailyCard({ path }) {
  const today = path.today?.day === dayKey() ? path.today.count : 0;
  const streak = currentStreak(path);
  const met = today >= DAILY_GOAL;
  return (
    <div className="kp-daily">
      <Mascot mood={met ? 'cheer' : 'happy'} size={70} />
      <div className="kp-daily__body">
        <strong>{met ? 'Meta de hoje cumprida! 🎉' : `Meta de hoje: ${DAILY_GOAL} lições`}</strong>
        <span className="kp-daily__dots" aria-label={`${Math.min(today, DAILY_GOAL)} de ${DAILY_GOAL}`}>
          {Array.from({ length: DAILY_GOAL }, (_, i) => <i key={i} className={i < today ? 'is-on' : undefined} />)}
        </span>
        <small>
          {streak > 1 ? `🔥 ${streak} dias seguidos! Volte amanhã para não apagar o foguinho.`
            : streak === 1 ? '🔥 Foguinho aceso! Volte amanhã para ele crescer.'
            : 'Faça uma lição por dia e acenda o foguinho 🔥'}
        </small>
      </div>
    </div>
  );
}

export default function KidsPath({ path, onStart, onUnlockAll }) {
  const done = path.done || {};
  const unlocked = index => path.unlockAll || index === 0 || done[ALL_LESSONS[index - 1].id] != null;
  const current = ALL_LESSONS.findIndex((lesson, index) => done[lesson.id] == null && unlocked(index));
  const currentRef = useRef(null);
  // Bring the next lesson into view by scrolling the path itself (scrollIntoView would also nudge the room).
  useEffect(() => {
    const node = currentRef.current;
    const stage = node?.closest('.kids-stage');
    if (stage) stage.scrollTop = Math.max(0, node.offsetTop - stage.clientHeight / 2);
  }, []);

  let index = -1;
  return (
    <div className="kp">
      <DailyCard path={path} />
      {UNITS.map((unit, u) => {
        const finished = unit.lessons.filter(l => done[l.id] != null).length;
        return (
          <section key={unit.id} className="kp-unit" style={{ '--c': unit.color }} aria-labelledby={`${unit.id}-title`}>
            <header className="kp-unit__banner">
              <div>
                <small>Unidade {u + 1} · {finished}/{unit.lessons.length}</small>
                <h2 id={`${unit.id}-title`}>{unit.title}</h2>
                <p>{unit.subtitle}</p>
              </div>
              <span className="kp-unit__icon" aria-hidden="true">{unit.icon}</span>
            </header>
            <ol className="kp-nodes">
              {unit.lessons.map((lesson, k) => {
                index += 1;
                const isDone = done[lesson.id] != null;
                const isOpen = unlocked(index);
                const isCurrent = index === current;
                // A winding trail, like footsteps across the page.
                const x = Math.round(Math.sin(k * 1.2) * 70);
                return (
                  <li key={lesson.id} className="kp-step" style={{ '--x': `${x}px`, '--mx': x >= 0 ? '-150px' : '74px' }} ref={isCurrent ? currentRef : undefined}>
                    {isCurrent && <span className="kp-start" aria-hidden="true">COMEÇAR</span>}
                    <button type="button" disabled={!isOpen} onClick={() => onStart(lesson, unit)}
                      className={`kp-node${lesson.review ? ' kp-node--review' : ''}${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}${isOpen ? '' : ' is-locked'}`}
                      aria-label={`${lesson.title}${isDone ? ', concluída' : isOpen ? '' : ', bloqueada'}`}>
                      <span className="kp-node__icon" aria-hidden="true">{isOpen ? lesson.icon : '🔒'}</span>
                      {isDone && <span className="kp-node__check" aria-hidden="true">✓</span>}
                    </button>
                    <span className="kp-step__title">{lesson.title}</span>
                    {isDone && <StarRow count={done[lesson.id]} />}
                    {isCurrent && <Mascot className="kp-mascot" size={84} />}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <div className="kp-end">
        <span aria-hidden="true">🏁</span>
        <p>No fim da trilha, a criança já acha as notas sem cores, reconhece sons graves e agudos, lê ritmos simples e as notas da pauta e toca músicas inteiras.</p>
      </div>
      <p className="kids-parents">
        <strong>Para os adultos:</strong> cada lição leva de 3 a 5 minutos. O que a criança erra volta no fim da lição, até acertar.
        A trilha abre uma lição por vez; se ela já sabe o básico, você pode{' '}
        <button type="button" className="kp-link" onClick={onUnlockAll}>{path.unlockAll ? 'voltar a abrir uma por vez' : 'liberar todas as lições'}</button>.
        <br />Modo Infantil criado por Carlos Eduardo.
      </p>
    </div>
  );
}
