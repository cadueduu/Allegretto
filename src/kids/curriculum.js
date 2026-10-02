// The learning path of the Modo Infantil: units of short lessons, each a mix of tiny exercises.
// Builders run when a lesson starts, so every replay shuffles notes and answers.
import { KIDS_SONGS, noteMidi, pitchClass, staffStep } from './kidsShared.jsx';
import { EAR, KEY_TIPS, LINES, RHYTHM_LEARN, STAFF_TIPS, TIPS } from './texts.js';

export { KEY_TIPS, STAFF_TIPS };

let uid = 0;
const ex = (type, props) => ({ uid: ++uid, type, ...props });
const shuffle = list => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const pick = list => list[Math.floor(Math.random() * list.length)];
const times = (n, make) => Array.from({ length: n }, (_, i) => make(i));

const [C, D, E, F, G, A, B, C5, D5, E5, F5, G5] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
const SEVEN = [C, D, E, F, G, A, B];
const LOW_STAFF = [C, D, E, F, G, A, B, C5];
const HIGH_STAFF = [C5, D5, E5, F5, G5];
const FULL_STAFF = [...LOW_STAFF, D5, E5, F5, G5];
const LINE_NOTES = [E, G, B, D5, F5];
const SPACE_NOTES = [F, A, C5, E5];
const C_SCALE = [C, D, E, F, G, A, B, C5];
const G_SCALE = [G, A, B, C5, D5, E5, 'F#5', G5];

const tip = id => ex('tip', { tip: TIPS[id] });

// ── Exercise builders ──────────────────────────────────────────────────────
const others = (note, pool, n = 2) => shuffle(pool.filter(p => pitchClass(p) !== pitchClass(note))).slice(0, n);
const intro = note => ex('intro', { note });
const find = (note, keys, hint = false, wide = false) => ex('find', { note, keys, hint, wide });
const nameIt = (note, pool, keys) => ex('name', { note, keys, options: shuffle([...new Set([pitchClass(note), ...others(note, pool).map(pitchClass)])]) });

const highLow = () => {
  const high = Math.random() < 0.5;
  return ex('ear', {
    question: EAR.highLow,
    seq: [[high ? pick(['C6', 'E6', 'G5']) : pick(['C3', 'E3', 'G2']), 1.5]],
    options: [{ id: 'low', art: '🐻', label: 'Grave' }, { id: 'high', art: '🐦', label: 'Agudo' }],
    answer: high ? 'high' : 'low',
  });
};
const upDown = (scale = false) => {
  let notes;
  if (scale) {
    const start = pick([0, 1, 2, 3]);
    notes = C_SCALE.slice(start, start + 5);
  } else {
    const index = SEVEN.indexOf(pick([C, D, E]));
    notes = pick([[0, 2, 4], [0, 1, 2], [0, 2, 3, 4], [0, 4, 7]]).map(s => C_SCALE[Math.min(7, index + s)]);
  }
  const up = Math.random() < 0.5;
  if (!up) notes = [...notes].reverse();
  return ex('ear', {
    question: scale ? EAR.upDownScale : EAR.upDown,
    seq: notes.map(n => [n, scale ? 0.6 : 1]),
    options: [{ id: 'up', art: '⬆️', label: 'Subiu' }, { id: 'down', art: '⬇️', label: 'Desceu' }],
    answer: up ? 'up' : 'down',
  });
};
const sameDiff = (close = false) => {
  const same = Math.random() < 0.5;
  const a = pick(SEVEN);
  const far = SEVEN.filter(n => Math.abs(SEVEN.indexOf(n) - SEVEN.indexOf(a)) >= (close ? 1 : 3));
  const b = same ? a : pick(far.length ? far : SEVEN.filter(n => n !== a));
  return ex('ear', {
    question: EAR.sameDiff,
    seq: [[a, 1], ['rest', 0.5], [b, 1]],
    options: [{ id: 'same', art: '🟰', label: 'Iguais' }, { id: 'diff', art: '↔️', label: 'Diferentes' }],
    answer: same ? 'same' : 'diff',
  });
};
// The parrot: the keys light up while the notes play (show), then the child repeats. Neighbouring
// notes only, so a little hand can follow.
const echo = (length, { show = true, keys = 'full', pool = [C, D, E] } = {}) => {
  const notes = [pick(pool)];
  while (notes.length < length) {
    const at = pool.indexOf(notes[notes.length - 1]);
    const near = pool.filter((n, i) => i !== at && Math.abs(i - at) <= 2);
    notes.push(pick(near));
  }
  return ex('echo', { notes, keys, show });
};

// Four-beat rhythms. 1 = tá, 2 = tá-a, 0.5 + 0.5 = ti-ti.
const QUARTERS = [[1, 1, 1, 1], [2, 2], [1, 1, 2], [2, 1, 1], [1, 2, 1]];
const EIGHTHS = [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [1, 1, 1, 0.5, 0.5], [0.5, 0.5, 1, 2]];
const rhythmLearn = value => ex('rhythm-learn', { ...RHYTHM_LEARN[value], bpm: 66 });
const rhythmChoose = pool => {
  const answer = pick(pool);
  const options = shuffle([answer, ...shuffle(pool.filter(p => p.join() !== answer.join())).slice(0, 2)]);
  return ex('rhythm-choose', { options, answer: options.indexOf(answer), bpm: 66 });
};
// Slow and with the rhythm playing softly underneath, so the child taps along with it.
const rhythmTap = (pool, guide = true) => ex('rhythm-tap', { pattern: pick(pool), bpm: guide ? 56 : 60, guide });

// ── Reading the staff ──────────────────────────────────────────────────────
const wideOf = notes => notes.some(n => noteMidi(n) > noteMidi(C5));
const staffIntro = note => ex('staff-intro', { note, wide: wideOf([note]), exact: true });
// Reading is exact: the Dó in the space and the Dó under the staff are different keys.
const staffPlay = note => ex('staff-play', { note, wide: wideOf([note]), exact: true });
const staffName = (note, pool) => ex('staff-name', { note, options: shuffle([...new Set([pitchClass(note), ...others(note, pool).map(pitchClass)])]) });
const staffFind = (note, pool) => {
  const options = shuffle([note, ...shuffle(pool.filter(p => p !== note && staffStep(p) !== staffStep(note))).slice(0, 2)]);
  return ex('staff-find', { note, options, answer: options.indexOf(note) });
};
const staffSeq = (notes, title) => ex('staff-seq', { notes, title, wide: wideOf(notes), exact: true });
const staffLines = note => ex('staff-lines', { note });
// Two notes far enough apart to see the difference, closer as the lessons go on.
const staffCompare = (pool, minGap = 3) => {
  let a;
  let b;
  do { a = pick(pool); b = pick(pool); } while (Math.abs(staffStep(a) - staffStep(b)) < minGap);
  return ex('staff-compare', { notes: [a, b], ask: Math.random() < 0.6 ? 'high' : 'low' });
};
const MELODIES = [[C, D, E], [E, D, C], [C, E, G], [G, F, E, D], [C, D, E, F], [E, F, G, A], [G, A, B, C5], [C5, B, A, G], [E, G, E, C], [F, A, C5, A], [D, E, F, G, A], [A, G, F, E, D]];
const SONG_BITS = [
  { title: 'O Carneirinho', notes: [E, D, C, D, E, E, E] },
  { title: 'Brilha Brilha Estrelinha', notes: [C, C, G, G, A, A, G] },
  { title: 'Hino da Alegria', notes: [E, E, F, G, G, F, E, D] },
  { title: 'Dó Ré Mi Fá', notes: [C, D, E, F, F, F] },
  { title: 'Jingle Bells', notes: [E, E, E, E, E, E, E, G, C, D, E] },
  { title: 'Brilha Brilha (parte 2)', notes: [F, F, E, E, D, D, C] },
  { title: 'O Carneirinho (parte 2)', notes: [D, D, D, E, G, G] },
  { title: 'Hino da Alegria (fim)', notes: [C, C, D, E, D, C, C] },
];
const HIGH_MELODIES = [[C5, D5, E5], [E5, D5, C5], [G5, F5, E5, D5, C5], [C5, E5, G5, E5, C5], [F5, E5, D5, C5, B], [G, B, D5, G5], [D5, E5, F5, G5], [E5, C5, A, F]];
const JUMPS = [[C, E, G], [G, E, C], [C, E, G, C5], [F, A, C5], [G, B, D5], [C5, G, E, C], [E, G, B, D5], [D, F, A, C5]];

// ── Scales ─────────────────────────────────────────────────────────────────
const scalePlay = (notes, { guide = true, keys = 'full', view = 'stairs', label } = {}) => ex('scale-play', { notes, guide, keys, view, label, wide: wideOf(notes) });
const samePc = (a, b) => pitchClass(a) === pitchClass(b);
const scaleMissing = (scale, options = 3) => {
  const missing = 1 + Math.floor(Math.random() * (scale.length - 2));
  const note = scale[missing];
  const pool = [...new Set(scale.map(pitchClass))].map(pc => `${pc}4`);
  return ex('scale-missing', { notes: scale, missing, options: shuffle([`${pitchClass(note)}4`, ...others(note, pool, options - 1)]) });
};
const scaleNeighbor = (scale, dir) => {
  const at = dir === 'next' ? Math.floor(Math.random() * (scale.length - 1)) : 1 + Math.floor(Math.random() * (scale.length - 1));
  const answer = scale[dir === 'next' ? at + 1 : at - 1];
  const pool = [...new Set(scale.map(pitchClass))].map(pc => `${pc}4`);
  return ex('scale-neighbor', { scale, at, dir, options: shuffle([`${pitchClass(answer)}4`, ...others(answer, pool.filter(p => !samePc(p, scale[at])))]) });
};
const PAIRS = [[C, D], [D, E], [E, F], [F, G], [G, A], [A, B], [B, C5]];
const halfStep = pair => ex('half-step', { pair: pair ?? pick(PAIRS) });
const orderIt = (length, dir = 'up', scale = C_SCALE) => {
  const start = Math.floor(Math.random() * (scale.length - length + 1));
  let notes = scale.slice(start, start + length);
  if (dir === 'down') notes = [...notes].reverse();
  return ex('order', { notes, dir });
};
const FIVE = [C, D, E, F, G];
const FIVE_BITS = [[C, D, E, F, G], [G, F, E, D, C], [C, D, E, D, C], [E, F, G, F, E], [C, E, G, E, C], [G, F, E, F, G]];

const songById = id => KIDS_SONGS.find(s => s.id === id);
const watch = id => ex('watch', { song: id });
const phrase = (id, from, to, label) => ex('phrase', { song: id, from, to: to ?? songById(id).notes.length, label });

// ── The path ───────────────────────────────────────────────────────────────
export const UNITS = [
  {
    id: 'u1', title: 'As notas e suas cores', subtitle: 'Conheça as sete notas do piano', color: '#ff9a3c', icon: '🌈',
    lessons: [
      { id: 'u1-1', title: 'Dó, Ré e Mi', icon: '🍬', build: () => [tip('colors'), intro(C), intro(D), intro(E), find(C, 'full'), find(E, 'full'), find(D, 'full'), ...shuffle([nameIt(E, [C, D, E], 'emoji'), nameIt(C, [C, D, E], 'emoji'), find(D, 'emoji'), find(E, 'emoji')])] },
      { id: 'u1-2', title: 'Fá e Sol', icon: '🧚', build: () => [intro(F), intro(G), find(F, 'full'), find(G, 'full'), ...shuffle([nameIt(G, [E, F, G], 'emoji'), nameIt(F, [D, F, G], 'emoji'), find(C, 'emoji'), find(F, 'emoji'), find(G, 'emoji'), find(E, 'emoji')])] },
      { id: 'u1-3', title: 'Lá e Si', icon: '🧶', build: () => [intro(A), intro(B), find(A, 'full'), find(B, 'full'), ...shuffle([nameIt(B, [G, A, B], 'emoji'), nameIt(A, [F, A, B], 'emoji'), find(G, 'emoji'), find(A, 'emoji'), find(B, 'emoji'), find(D, 'emoji')])] },
      { id: 'u1-4', title: 'As sete notas', icon: '🎹', build: () => [tip('sevenNotes'), ...shuffle([...shuffle(SEVEN).slice(0, 6).map(n => find(n, 'emoji')), ...shuffle(SEVEN).slice(0, 4).map(n => nameIt(n, SEVEN, 'emoji'))])] },
      { id: 'u1-r', title: 'Desafio das cores', icon: '🏆', review: true, build: () => shuffle([...shuffle(SEVEN).map(n => find(n, 'emoji')), ...shuffle(SEVEN).slice(0, 4).map(n => nameIt(n, SEVEN, 'emoji'))]) },
    ],
  },
  {
    id: 'u2', title: 'Piano de verdade', subtitle: 'Ache as notas sem cores, pelas teclas pretas', color: '#22b8d6', icon: '🎯',
    lessons: [
      { id: 'u2-1', title: 'O Dó e as duas pretas', icon: '2️⃣', build: () => [tip('twoBlack'), find(C, 'plain', true), find(C, 'plain', true), find(D, 'plain', true), find(E, 'plain', true), ...shuffle([find(C, 'plain'), find(E, 'plain'), find(D, 'plain'), nameIt(C, [C, D, E], 'plain'), nameIt(E, [C, D, E], 'plain')])] },
      { id: 'u2-2', title: 'O Fá e as três pretas', icon: '3️⃣', build: () => [tip('threeBlack'), find(F, 'plain', true), find(G, 'plain', true), find(A, 'plain', true), find(B, 'plain', true), ...shuffle([find(F, 'plain'), find(B, 'plain'), find(G, 'plain'), nameIt(F, [E, F, G], 'plain'), nameIt(B, [G, A, B], 'plain')])] },
      { id: 'u2-3', title: 'O teclado inteiro', icon: '🗺️', build: () => shuffle([...shuffle(SEVEN).map(n => find(n, 'plain')), ...shuffle(SEVEN).slice(0, 3).map(n => nameIt(n, SEVEN, 'plain'))]) },
      { id: 'u2-r', title: 'Desafio sem cores', icon: '🏆', review: true, build: () => shuffle([...SEVEN.map(n => find(n, 'plain')), find(C5, 'plain'), ...shuffle(SEVEN).slice(0, 3).map(n => nameIt(n, SEVEN, 'plain'))]) },
    ],
  },
  {
    id: 'u5', title: 'Lendo partitura', subtitle: 'Cada nota tem sua casinha na pauta', color: '#5b7cfa', icon: '🎼',
    lessons: [
      { id: 'u5-1', title: 'Dó, Ré e Mi na pauta', icon: '📏', build: () => [tip('staff'), staffIntro(C), staffIntro(D), staffIntro(E), ...shuffle([...times(4, () => staffPlay(pick([C, D, E]))), staffName(E, [C, D, E]), staffName(C, [C, D, E]), staffName(D, [C, D, E])])] },
      { id: 'u5-2', title: 'Fá e Sol na pauta', icon: '🪜', build: () => [staffIntro(F), staffIntro(G), ...shuffle([staffPlay(F), staffPlay(G), ...times(3, () => staffPlay(pick([C, D, E, F, G]))), staffName(G, [E, F, G]), staffName(F, [D, F, G]), staffName(pick([C, D, E]), [C, D, E, F, G])])] },
      { id: 'u5-3', title: 'Lá, Si e Dó agudo', icon: '🧗', build: () => [staffIntro(A), staffIntro(B), staffIntro(C5), ...shuffle([staffPlay(A), staffPlay(B), staffPlay(C5), ...times(3, () => staffPlay(pick(LOW_STAFF))), staffName(B, [G, A, B]), staffName(A, [F, A, B])])] },
      { id: 'u5-4', title: 'Ditado da pauta', icon: '✏️', build: () => [tip('dictation'), ...shuffle([...shuffle(LOW_STAFF).slice(0, 5).map(n => staffFind(n, LOW_STAFF)), ...times(3, () => staffPlay(pick(LOW_STAFF))), ...times(2, () => { const n = pick(LOW_STAFF); return staffName(n, LOW_STAFF); })])] },
      { id: 'u5-5', title: 'Lendo melodias', icon: '📖', build: () => [...shuffle(MELODIES).slice(0, 6).map(m => staffSeq(m)), ...times(2, () => staffPlay(pick(LOW_STAFF)))] },
      { id: 'u5-r', title: 'Desafio da pauta', icon: '🏆', review: true, build: () => shuffle([...shuffle(LOW_STAFF).slice(0, 5).map(staffPlay), ...shuffle(SEVEN).slice(0, 3).map(n => staffName(n, SEVEN)), ...times(2, () => staffFind(pick(LOW_STAFF), LOW_STAFF)), ...shuffle(MELODIES).slice(0, 2).map(m => staffSeq(m))]) },
    ],
  },
  {
    id: 'sc1', title: 'Escalas', subtitle: 'A escada de notas que todo pianista toca', color: '#ff6fa3', icon: '🪜',
    lessons: [
      { id: 'sc1-1', title: 'A escada das notas', icon: '🪜', build: () => [tip('scale'), scalePlay(C_SCALE), scalePlay(C_SCALE), ...times(3, () => scaleMissing(C_SCALE)), ...times(3, () => scaleNeighbor(C_SCALE, 'next'))] },
      { id: 'sc1-2', title: 'Descendo a escada', icon: '🛝', build: () => [tip('scaleDown'), scalePlay([...C_SCALE].reverse()), scalePlay([...C_SCALE].reverse()), ...shuffle([...times(2, () => scaleMissing([...C_SCALE].reverse())), ...times(3, () => scaleNeighbor(C_SCALE, 'before')), upDown(true), upDown(true)])] },
      { id: 'sc1-3', title: 'Cinco dedinhos', icon: '🖐️', build: () => [tip('fiveFingers'), scalePlay(FIVE), scalePlay([...FIVE].reverse()), ...shuffle(FIVE_BITS).slice(0, 5).map(notes => scalePlay(notes, { label: LINES.fiveFingers })), scaleMissing(FIVE)] },
      { id: 'sc1-4', title: 'Vizinhos colados', icon: '🤝', build: () => [tip('halfStep'), halfStep([E, F]), halfStep([C, D]), halfStep([B, C5]), ...shuffle(PAIRS).map(p => halfStep(p))] },
      { id: 'sc1-5', title: 'Em ordem!', icon: '🔢', build: () => [tip('order'), orderIt(3), orderIt(3), orderIt(4), orderIt(4), orderIt(5), orderIt(3, 'down'), orderIt(4, 'down'), orderIt(5)] },
      { id: 'sc1-6', title: 'Escala sem ajuda', icon: '🦸', build: () => [scalePlay(C_SCALE, { guide: false }), scalePlay([...C_SCALE].reverse(), { guide: false }), scalePlay(C_SCALE, { guide: false, keys: 'emoji' }), ...shuffle([scaleMissing(C_SCALE, 4), scaleMissing(C_SCALE, 4), scaleNeighbor(C_SCALE, 'next'), scaleNeighbor(C_SCALE, 'before'), orderIt(5)]), scalePlay(C_SCALE, { guide: false, keys: 'plain' })] },
      { id: 'sc1-7', title: 'A escala na partitura', icon: '🎼', build: () => [tip('scaleStaff'), scalePlay(C_SCALE, { view: 'staff' }), scalePlay([...C_SCALE].reverse(), { view: 'staff' }), staffSeq([C, D, E, F]), staffSeq([G, A, B, C5]), staffSeq([C5, B, A, G]), ...times(3, () => staffFind(pick(C_SCALE), C_SCALE)), scalePlay(C_SCALE, { view: 'staff', guide: false })] },
      { id: 'sc1-r', title: 'Desafio das escalas', icon: '🏆', review: true, build: () => shuffle([scalePlay(C_SCALE, { guide: false }), scalePlay([...C_SCALE].reverse(), { guide: false }), scaleMissing(C_SCALE, 4), scaleMissing([...C_SCALE].reverse(), 4), scaleNeighbor(C_SCALE, 'next'), scaleNeighbor(C_SCALE, 'before'), halfStep([E, F]), halfStep(), orderIt(5), staffSeq([C, D, E, F, G])]) },
    ],
  },
  {
    id: 'rd2', title: 'Linhas e espaços', subtitle: 'Leia a pauta cada vez mais rápido', color: '#2fb59a', icon: '📏',
    lessons: [
      { id: 'rd2-1', title: 'Linha ou espaço?', icon: '➖', build: () => [tip('lines'), tip('spaces'), ...times(8, () => staffLines(pick([C, E, F, G, A, B, C5])))] },
      { id: 'rd2-2', title: 'As linhas: Mi, Sol, Si', icon: '🍢', build: () => [tip('lineNotes'), ...shuffle([...times(4, () => staffPlay(pick([E, G, B]))), staffName(E, [E, G, B]), staffName(G, [E, G, B]), staffName(B, [E, G, B]), staffLines(pick([E, G, B])), staffFind(pick([E, G, B]), LOW_STAFF)])] },
      { id: 'rd2-3', title: 'Os espaços: Fá, Lá, Dó', icon: '🪟', build: () => [tip('spaceNotes'), ...shuffle([...times(4, () => staffPlay(pick([F, A, C5]))), staffName(F, [F, A, C5]), staffName(A, [F, A, C5]), staffName(C5, [F, A, C5]), staffLines(pick([F, A, C5])), staffFind(pick([F, A, C5]), LOW_STAFF)])] },
      { id: 'rd2-4', title: 'Mais aguda ou mais grave?', icon: '↕️', build: () => [tip('higher'), ...times(4, () => staffCompare(LOW_STAFF, 3)), ...times(4, () => staffCompare(LOW_STAFF, 1))] },
      { id: 'rd2-5', title: 'Leitura rápida', icon: '⚡', build: () => shuffle([...times(6, () => staffPlay(pick(LOW_STAFF))), ...times(2, () => staffFind(pick(LOW_STAFF), LOW_STAFF)), ...times(2, () => staffName(pick(LOW_STAFF), LOW_STAFF)), staffLines(pick(LOW_STAFF.filter(n => n !== D)))]) },
      { id: 'rd2-6', title: 'Músicas na partitura', icon: '🎶', build: () => [tip('songsOnStaff'), ...shuffle(SONG_BITS).slice(0, 6).map(bit => staffSeq(bit.notes, bit.title))] },
      { id: 'rd2-7', title: 'Pulando degraus', icon: '🐸', build: () => [tip('jumps'), ...shuffle(JUMPS.filter(j => !wideOf(j))).slice(0, 5).map(j => staffSeq(j)), staffCompare(LOW_STAFF, 2), staffCompare(LOW_STAFF, 2)] },
      { id: 'rd2-r', title: 'Desafio da leitura', icon: '🏆', review: true, build: () => shuffle([...times(4, () => staffPlay(pick(LOW_STAFF))), staffLines(pick(LINE_NOTES.slice(0, 3))), staffLines(pick(SPACE_NOTES.slice(0, 3))), staffCompare(LOW_STAFF, 1), staffFind(pick(LOW_STAFF), LOW_STAFF), ...shuffle(SONG_BITS).slice(0, 2).map(bit => staffSeq(bit.notes, bit.title))]) },
    ],
  },
  {
    id: 'u3', title: 'Ouvidinho', subtitle: 'Escute: grave, agudo, sobe e desce', color: '#b065f0', icon: '👂',
    lessons: [
      { id: 'u3-1', title: 'Grave ou agudo', icon: '🐻', build: () => [tip('highLow'), ...times(8, highLow)] },
      { id: 'u3-2', title: 'Sobe ou desce', icon: '⬆️', build: () => [tip('upDown'), ...times(8, () => upDown())] },
      { id: 'u3-3', title: 'Igual ou diferente', icon: '🟰', build: () => [tip('sameDiff'), ...times(5, () => sameDiff()), ...times(3, () => sameDiff(true))] },
      { id: 'u3-4', title: 'O papagaio', icon: '🦜', build: () => [tip('echo'), echo(1), echo(1), echo(1), echo(2), echo(2), echo(2)] },
      { id: 'u3-r', title: 'Desafio do ouvido', icon: '🏆', review: true, build: () => shuffle([highLow(), highLow(), upDown(), upDown(), sameDiff(true), sameDiff(true), echo(2), echo(2), echo(2, { pool: [C, D, E, F, G] })]) },
    ],
  },
  {
    id: 'rd3', title: 'Notas agudas', subtitle: 'A pauta inteira, até o Sol lá em cima', color: '#ff9f1c', icon: '🏔️',
    lessons: [
      { id: 'rd3-1', title: 'Ré e Mi agudos', icon: '⛰️', build: () => [tip('highNotes'), staffIntro(D5), staffIntro(E5), ...shuffle([staffPlay(D5), staffPlay(E5), staffPlay(C5), ...times(3, () => staffPlay(pick([C5, D5, E5, A, B]))), staffName(D5, [C5, D5, E5]), staffName(E5, [C5, D5, E5])])] },
      { id: 'rd3-2', title: 'Fá e Sol agudos', icon: '🏔️', build: () => [staffIntro(F5), staffIntro(G5), ...shuffle([staffPlay(F5), staffPlay(G5), ...times(4, () => staffPlay(pick(HIGH_STAFF))), staffName(F5, [D5, E5, F5]), staffName(G5, [E5, F5, G5])])] },
      { id: 'rd3-3', title: 'A pauta inteira', icon: '🗻', build: () => [tip('wholeStaff'), ...shuffle([...times(6, () => staffPlay(pick(FULL_STAFF))), staffLines(pick([D5, F5])), staffLines(E5), staffFind(pick(HIGH_STAFF), FULL_STAFF), staffFind(pick(FULL_STAFF), FULL_STAFF)])] },
      { id: 'rd3-4', title: 'Mais aguda na pauta inteira', icon: '↕️', build: () => [...times(4, () => staffCompare(FULL_STAFF, 3)), ...times(4, () => staffCompare(FULL_STAFF, 1))] },
      { id: 'rd3-5', title: 'Melodias lá em cima', icon: '🎈', build: () => [...shuffle(HIGH_MELODIES).slice(0, 5).map(m => staffSeq(m)), ...shuffle(JUMPS.filter(wideOf)).slice(0, 2).map(m => staffSeq(m))] },
      { id: 'rd3-r', title: 'Desafio da pauta inteira', icon: '🏆', review: true, build: () => shuffle([...times(5, () => staffPlay(pick(FULL_STAFF))), staffName(pick(HIGH_STAFF), HIGH_STAFF), staffLines(pick(LINE_NOTES)), staffLines(pick(SPACE_NOTES)), staffCompare(FULL_STAFF, 1), ...shuffle(HIGH_MELODIES).slice(0, 2).map(m => staffSeq(m))]) },
    ],
  },
  {
    id: 'sc2', title: 'Escala de Sol', subtitle: 'Uma escala nova com uma tecla preta', color: '#e0559b', icon: '☀️',
    lessons: [
      { id: 'sc2-1', title: 'O Fá sustenido', icon: '♯', build: () => [tip('gScale'), staffIntro('F#5'), find('F#5', 'full', false, true), find('F#5', 'full', false, true), staffPlay('F#5'), staffPlay(F5), staffPlay('F#5'), staffPlay(G5)] },
      { id: 'sc2-2', title: 'Escala de Sol subindo', icon: '⬆️', build: () => [scalePlay(G_SCALE), scalePlay(G_SCALE), ...times(3, () => scaleMissing(G_SCALE)), ...times(2, () => scaleNeighbor(G_SCALE, 'next')), scalePlay(G_SCALE, { guide: false })] },
      { id: 'sc2-3', title: 'Escala de Sol descendo', icon: '⬇️', build: () => [scalePlay([...G_SCALE].reverse()), scalePlay([...G_SCALE].reverse()), ...times(2, () => scaleNeighbor(G_SCALE, 'before')), scaleMissing([...G_SCALE].reverse()), scalePlay(G_SCALE, { view: 'staff' }), scalePlay([...G_SCALE].reverse(), { guide: false })] },
      { id: 'sc2-r', title: 'Desafio das duas escalas', icon: '🏆', review: true, build: () => shuffle([scalePlay(C_SCALE, { guide: false }), scalePlay(G_SCALE, { guide: false }), scaleMissing(G_SCALE, 4), scaleMissing(C_SCALE, 4), scaleNeighbor(G_SCALE, 'next'), staffPlay('F#5'), staffSeq([G, A, B, C5]), staffSeq([D5, E5, 'F#5', G5])]) },
    ],
  },
  {
    id: 'u4', title: 'Ritmo', subtitle: 'Tá, tá-a e ti-ti, bem devagar', color: '#ff5d5d', icon: '🥁',
    lessons: [
      { id: 'u4-1', title: 'Tá e tá-a', icon: '🥁', build: () => [tip('beat'), rhythmLearn(1), rhythmLearn(2), rhythmChoose(QUARTERS), rhythmChoose(QUARTERS), rhythmTap(QUARTERS), rhythmTap(QUARTERS), rhythmChoose(QUARTERS)] },
      { id: 'u4-2', title: 'Ti-ti', icon: '🐇', build: () => [rhythmLearn(0.5), rhythmChoose(EIGHTHS), rhythmChoose(EIGHTHS), rhythmTap(EIGHTHS), rhythmChoose(EIGHTHS), rhythmTap(EIGHTHS)] },
      { id: 'u4-3', title: 'Misturando', icon: '🎶', build: () => shuffle([rhythmChoose([...QUARTERS, ...EIGHTHS]), rhythmChoose([...QUARTERS, ...EIGHTHS]), rhythmChoose(EIGHTHS), rhythmTap(QUARTERS), rhythmTap(EIGHTHS), rhythmTap([...QUARTERS, ...EIGHTHS])]) },
      { id: 'u4-r', title: 'Desafio do ritmo', icon: '🏆', review: true, build: () => shuffle([rhythmChoose(EIGHTHS), rhythmChoose(QUARTERS), rhythmChoose(EIGHTHS), rhythmTap(QUARTERS, false), rhythmTap(EIGHTHS), rhythmTap(QUARTERS, false)]) },
    ],
  },
  {
    id: 'u6', title: 'Minhas músicas', subtitle: 'Toque músicas inteiras, um pedaço por vez', color: '#43c96b', icon: '🎵',
    lessons: [
      { id: 'u6-1', title: 'Dó Ré Mi Fá', icon: '🎈', build: () => [tip('songs'), watch('doremi'), phrase('doremi', 0, 6, 'Pedaço 1'), phrase('doremi', 6, 12, 'Pedaço 2'), phrase('doremi', 12, 18, 'Pedaço 3'), phrase('doremi', 18, 24, 'Pedaço 4'), phrase('doremi', 0, 24, 'A música toda')] },
      { id: 'u6-2', title: 'O Carneirinho', icon: '🐑', build: () => [watch('mary'), phrase('mary', 0, 13, 'Primeira metade'), phrase('mary', 13, 26, 'Segunda metade'), phrase('mary', 0, 26, 'A música toda')] },
      { id: 'u6-3', title: 'Brilha Brilha Estrelinha', icon: '⭐', build: () => [watch('twinkle'), phrase('twinkle', 0, 14, 'Começo'), phrase('twinkle', 14, 28, 'Meio'), phrase('twinkle', 28, 42, 'Fim'), phrase('twinkle', 0, 42, 'A música toda')] },
      { id: 'u6-4', title: 'Parabéns pra Você', icon: '🎂', build: () => [watch('parabens'), phrase('parabens', 0, 12, 'Primeira parte'), phrase('parabens', 12, 25, 'Segunda parte'), phrase('parabens', 0, 25, 'A música toda')] },
      { id: 'u6-r', title: 'O grande show', icon: '🏆', review: true, build: () => [watch('ode'), phrase('ode', 0, 15, 'Primeira parte'), phrase('ode', 15, 30, 'Segunda parte'), phrase('ode', 0, 30, 'Hino da Alegria inteiro')] },
    ],
  },
];

export const ALL_LESSONS = UNITS.flatMap(unit => unit.lessons.map(lesson => ({ ...lesson, unit })));

// Free practice from the "Brincar" tab: a fresh mix every time, outside the path.
export const PRACTICE = {
  reading: {
    id: 'practice-reading', title: 'Treino de partitura', icon: '🎼', practice: true,
    unit: { id: 'practice', title: 'Treino', color: '#5b7cfa' },
    build: () => shuffle([...times(6, () => staffPlay(pick(LOW_STAFF))), ...times(2, () => staffFind(pick(LOW_STAFF), LOW_STAFF)), ...times(2, () => staffName(pick(LOW_STAFF), LOW_STAFF)), staffLines(pick([E, F, G, A, B, C5])), staffCompare(LOW_STAFF, 1), ...shuffle(SONG_BITS).slice(0, 2).map(bit => staffSeq(bit.notes, bit.title))]),
  },
  scales: {
    id: 'practice-scales', title: 'Treino de escalas', icon: '🪜', practice: true,
    unit: { id: 'practice', title: 'Treino', color: '#ff6fa3' },
    build: () => shuffle([scalePlay(C_SCALE, { guide: false }), scalePlay([...C_SCALE].reverse(), { guide: false }), scalePlay(pick(FIVE_BITS), { label: LINES.fiveFingers }), scaleMissing(C_SCALE, 4), scaleMissing([...C_SCALE].reverse(), 4), scaleNeighbor(C_SCALE, 'next'), scaleNeighbor(C_SCALE, 'before'), halfStep(), orderIt(4), orderIt(5, pick(['up', 'down'])), scalePlay(C_SCALE, { view: 'staff', guide: false })]),
  },
};

export { songById };
