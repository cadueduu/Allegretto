// The learning path of the Modo Infantil: units of short lessons, each a mix of tiny exercises.
// Builders run when a lesson starts, so every replay shuffles notes and answers.
import { KIDS_SONGS, NOTE_INFO, pitchClass } from './kidsShared.jsx';

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
const nameOf = note => NOTE_INFO[pitchClass(note)].name;

const [C, D, E, F, G, A, B, C5] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const SEVEN = [C, D, E, F, G, A, B];

// Where each white key lives, told by the black keys around it — how pianists find notes without colors.
export const KEY_TIPS = {
  C: 'O Dó fica logo antes das duas teclas pretas.',
  D: 'O Ré fica no meio das duas teclas pretas.',
  E: 'O Mi fica logo depois das duas teclas pretas.',
  F: 'O Fá fica logo antes das três teclas pretas.',
  G: 'O Sol fica entre a primeira e a segunda das três pretas.',
  A: 'O Lá fica entre a segunda e a terceira das três pretas.',
  B: 'O Si fica logo depois das três teclas pretas.',
};
// Where each note lives on the treble staff.
export const STAFF_TIPS = {
  C4: 'O Dó fica numa linha pequenininha, embaixo da pauta.',
  D4: 'O Ré fica pendurado logo embaixo da primeira linha.',
  E4: 'O Mi mora na primeira linha, a de baixo.',
  F4: 'O Fá mora no primeiro espaço, entre duas linhas.',
  G4: 'O Sol mora na segunda linha, onde a clave de sol se enrola.',
  A4: 'O Lá mora no segundo espaço.',
  B4: 'O Si mora na linha do meio.',
  C5: 'O Dó agudo mora no terceiro espaço.',
};

const TIPS = {
  colors: { art: '🌈', title: 'Cada nota tem uma cor', text: 'Oi! Eu sou a Nina, a notinha. No nosso piano cada nota tem uma cor e um desenho. Vamos conhecer as três primeiras!' },
  sevenNotes: { art: '🎹', title: 'Sete notas', text: 'A música toda é feita com sete notas: Dó, Ré, Mi, Fá, Sol, Lá e Si. Depois do Si, começa outro Dó!' },
  twoBlack: { title: 'As duas teclas pretas', text: 'Agora sem cores, igual a um piano de verdade! As teclas pretas vêm em grupos de duas e de três. O Dó fica sempre logo antes das duas pretas.', keys: 'plain', highlight: ['C4', 'C5'] },
  threeBlack: { title: 'As três teclas pretas', text: 'O Fá fica sempre logo antes das três teclas pretas. Achou o grupo de três? O Fá está do lado esquerdo dele.', keys: 'plain', highlight: ['F4'] },
  highLow: { art: '🐻 🐦', title: 'Grave e agudo', text: 'Sons graves são grossos, como um urso. Sons agudos são fininhos, como um passarinho. Toque nos botões para ouvir.', sounds: [['🐻 Grave', [['C3', 1.5]]], ['🐦 Agudo', [['C6', 1.5]]]] },
  upDown: { art: '⬆️ ⬇️', title: 'Subindo e descendo', text: 'No piano, quanto mais para a direita, mais agudo o som. Se as notas vão para a direita, a melodia sobe. Para a esquerda, ela desce.', sounds: [['⬆️ Sobe', [[C, 1], [E, 1], [G, 1]]], ['⬇️ Desce', [[G, 1], [E, 1], [C, 1]]]] },
  sameDiff: { art: '👂', title: 'Igual ou diferente', text: 'Agora vou tocar duas notas. Escute bem: elas são iguaizinhas ou diferentes?', sounds: [['🟰 Iguais', [[E, 1], ['rest', 0.4], [E, 1]]], ['↔️ Diferentes', [[C, 1], ['rest', 0.4], [A, 1]]]] },
  echo: { art: '🦜', title: 'Seja um papagaio', text: 'Eu toco, você repete! Escute com atenção e toque as mesmas notas, na mesma ordem.' },
  beat: { art: '🥁', title: 'O tempo da música', text: 'Toda música tem um pulso, como o coração: tum, tum, tum. Cada batida é um tempo.' },
  staff: { title: 'A pauta', text: 'A música se escreve numa pauta de cinco linhas. Cada nota tem sua casinha: numa linha ou num espaço. Quanto mais alta na pauta, mais agudo o som.', staff: [C, E, G, C5] },
  songs: { art: '🎵', title: 'Hora do show', text: 'Primeiro a gente escuta a música inteira. Depois você toca um pedacinho de cada vez. No fim, ela toda!' },
};
const tip = id => ex('tip', { tip: TIPS[id] });

// ── Exercise builders ──────────────────────────────────────────────────────
const intro = note => ex('intro', { note });
const find = (note, keys, hint = false) => ex('find', { note, keys, hint });
const nameIt = (note, pool, keys) => ex('name', { note, keys, options: shuffle([...new Set([pitchClass(note), ...shuffle(pool.map(pitchClass).filter(pc => pc !== pitchClass(note))).slice(0, 2)])]) });

const highLow = () => {
  const high = Math.random() < 0.5;
  return ex('ear', {
    question: 'Esse som é grave ou agudo?',
    seq: [[high ? pick(['C6', 'E6', 'G5']) : pick(['C3', 'E3', 'G2']), 1.5]],
    options: [{ id: 'low', art: '🐻', label: 'Grave' }, { id: 'high', art: '🐦', label: 'Agudo' }],
    answer: high ? 'high' : 'low',
  });
};
const upDown = () => {
  const start = pick([C, D, E]);
  const steps = pick([[0, 2, 4], [0, 1, 2], [0, 2, 3, 4], [0, 4, 7]]);
  const index = SEVEN.indexOf(start);
  let notes = steps.map(s => [...SEVEN, C5][Math.min(7, index + s)]);
  const up = Math.random() < 0.5;
  if (!up) notes = [...notes].reverse();
  return ex('ear', {
    question: 'A melodia subiu ou desceu?',
    seq: notes.map(n => [n, 1]),
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
    question: 'As duas notas são iguais ou diferentes?',
    seq: [[a, 1], ['rest', 0.5], [b, 1]],
    options: [{ id: 'same', art: '🟰', label: 'Iguais' }, { id: 'diff', art: '↔️', label: 'Diferentes' }],
    answer: same ? 'same' : 'diff',
  });
};
const echo = (length, keys = 'full', pool = [C, D, E, F, G]) => {
  const notes = [];
  while (notes.length < length) {
    const n = pick(pool);
    if (n !== notes[notes.length - 1]) notes.push(n);
  }
  return ex('echo', { notes, keys });
};

// Four-beat rhythms. 1 = tá, 2 = tá-a, 0.5 + 0.5 = ti-ti.
const QUARTERS = [[1, 1, 1, 1], [2, 2], [1, 1, 2], [2, 1, 1], [1, 2, 1]];
const EIGHTHS = [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 2], [1, 1, 1, 0.5, 0.5], [0.5, 0.5, 1, 0.5, 0.5, 1]];
const RHYTHM_LEARN = {
  1: { title: 'Semínima: tá', text: 'Esta nota dura um tempo. Quando ela aparece, a gente fala "tá"!', pattern: [1, 1, 1, 1] },
  2: { title: 'Mínima: tá-a', text: 'Esta nota é vazia por dentro e dura dois tempos. A gente fala "tá-a" e segura.', pattern: [2, 2] },
  0.5: { title: 'Colcheias: ti-ti', text: 'Duas colcheias juntinhas cabem num tempo só. São rapidinhas: "ti-ti"!', pattern: [0.5, 0.5, 0.5, 0.5, 1, 1] },
};
const rhythmLearn = value => ex('rhythm-learn', { ...RHYTHM_LEARN[value], bpm: 84 });
const rhythmChoose = pool => {
  const answer = pick(pool);
  const others = shuffle(pool.filter(p => p.join() !== answer.join())).slice(0, 2);
  const options = shuffle([answer, ...others]);
  return ex('rhythm-choose', { options, answer: options.indexOf(answer), bpm: 84 });
};
const rhythmTap = pool => ex('rhythm-tap', { pattern: pick(pool), bpm: 76 });

const staffIntro = note => ex('staff-intro', { note });
const staffPlay = note => ex('staff-play', { note });
const staffName = (note, pool) => ex('staff-name', { note, options: shuffle([...new Set([pitchClass(note), ...shuffle(pool.map(pitchClass).filter(pc => pc !== pitchClass(note))).slice(0, 2)])]) });
const MELODIES = [[C, D, E], [E, D, C], [C, E, G], [G, F, E, D], [C, D, E, F], [E, F, G, A], [G, A, B, C5], [C5, B, A, G], [E, G, E, C], [F, A, C5, A]];
const staffSeq = notes => ex('staff-seq', { notes });

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
    id: 'u3', title: 'Ouvidinho', subtitle: 'Escute: grave, agudo, sobe e desce', color: '#b065f0', icon: '👂',
    lessons: [
      { id: 'u3-1', title: 'Grave ou agudo', icon: '🐻', build: () => [tip('highLow'), ...Array.from({ length: 8 }, highLow)] },
      { id: 'u3-2', title: 'Sobe ou desce', icon: '⬆️', build: () => [tip('upDown'), ...Array.from({ length: 8 }, upDown)] },
      { id: 'u3-3', title: 'Igual ou diferente', icon: '🟰', build: () => [tip('sameDiff'), ...Array.from({ length: 5 }, () => sameDiff()), ...Array.from({ length: 3 }, () => sameDiff(true))] },
      { id: 'u3-4', title: 'O papagaio', icon: '🦜', build: () => [tip('echo'), echo(1), echo(1), echo(1), echo(2), echo(2), echo(2), echo(3), echo(3)] },
      { id: 'u3-r', title: 'Desafio do ouvido', icon: '🏆', review: true, build: () => shuffle([highLow(), highLow(), upDown(), upDown(), sameDiff(true), sameDiff(true), echo(2, 'emoji'), echo(2, 'emoji'), echo(3, 'emoji'), echo(3, 'emoji')]) },
    ],
  },
  {
    id: 'u4', title: 'Ritmo', subtitle: 'Tá, tá-a e ti-ti: sinta o pulso', color: '#ff5d5d', icon: '🥁',
    lessons: [
      { id: 'u4-1', title: 'Tá e tá-a', icon: '🥁', build: () => [tip('beat'), rhythmLearn(1), rhythmLearn(2), rhythmChoose(QUARTERS), rhythmChoose(QUARTERS), rhythmTap(QUARTERS), rhythmTap(QUARTERS), rhythmChoose(QUARTERS), rhythmTap(QUARTERS)] },
      { id: 'u4-2', title: 'Ti-ti', icon: '🐇', build: () => [rhythmLearn(0.5), rhythmChoose(EIGHTHS), rhythmChoose(EIGHTHS), rhythmTap(EIGHTHS), rhythmTap(EIGHTHS), rhythmChoose(EIGHTHS), rhythmTap(EIGHTHS)] },
      { id: 'u4-3', title: 'Misturando', icon: '🎶', build: () => shuffle([rhythmChoose([...QUARTERS, ...EIGHTHS]), rhythmChoose([...QUARTERS, ...EIGHTHS]), rhythmChoose(EIGHTHS), rhythmTap(QUARTERS), rhythmTap(EIGHTHS), rhythmTap(EIGHTHS), rhythmTap([...QUARTERS, ...EIGHTHS])]) },
      { id: 'u4-r', title: 'Desafio do ritmo', icon: '🏆', review: true, build: () => shuffle([rhythmChoose(EIGHTHS), rhythmChoose(QUARTERS), rhythmChoose(EIGHTHS), rhythmTap(QUARTERS), rhythmTap(EIGHTHS), rhythmTap(EIGHTHS), rhythmTap(EIGHTHS)]) },
    ],
  },
  {
    id: 'u5', title: 'Lendo partitura', subtitle: 'Cada nota tem sua casinha na pauta', color: '#5b7cfa', icon: '🎼',
    lessons: [
      { id: 'u5-1', title: 'Dó, Ré e Mi na pauta', icon: '📏', build: () => [tip('staff'), staffIntro(C), staffIntro(D), staffIntro(E), ...shuffle([staffPlay(C), staffPlay(E), staffPlay(D), staffName(E, [C, D, E]), staffName(C, [C, D, E])])] },
      { id: 'u5-2', title: 'Fá e Sol na pauta', icon: '🪜', build: () => [staffIntro(F), staffIntro(G), ...shuffle([staffPlay(F), staffPlay(G), staffPlay(E), staffPlay(D), staffName(G, [E, F, G]), staffName(F, [D, F, G])])] },
      { id: 'u5-3', title: 'Lá, Si e Dó agudo', icon: '🧗', build: () => [staffIntro(A), staffIntro(B), staffIntro(C5), ...shuffle([staffPlay(A), staffPlay(B), staffPlay(C5), staffPlay(G), staffName(B, [G, A, B]), staffName(A, [F, A, B])])] },
      { id: 'u5-4', title: 'Lendo melodias', icon: '📖', build: () => shuffle(MELODIES).slice(0, 6).map(staffSeq) },
      { id: 'u5-r', title: 'Desafio da pauta', icon: '🏆', review: true, build: () => shuffle([...shuffle([...SEVEN, C5]).slice(0, 5).map(staffPlay), ...shuffle(SEVEN).slice(0, 3).map(n => staffName(n, SEVEN)), ...shuffle(MELODIES).slice(0, 2).map(staffSeq)]) },
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
export { nameOf, songById };
