// Everything Nina says in the Modo Infantil, in one plain-JS module (no JSX) so the script that records
// her voice (scripts/nina-voice) can list every line and the lesson code can't drift from the recordings.

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
export const BLACK_NAMES = { 'C#': 'Dó♯', 'D#': 'Mi♭', 'F#': 'Fá♯', 'G#': 'Sol♯', 'A#': 'Si♭' };
const [C, D, E, F, G, A, B, C5, D5, E5, F5, G5] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
const C_SCALE = [C, D, E, F, G, A, B, C5];
const G_SCALE = [G, A, B, C5, D5, E5, 'F#5', G5];
const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const nameOf = pc => NOTE_INFO[pc]?.name ?? BLACK_NAMES[pc];

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
// Where each note lives on the treble staff. Lines from the bottom: Mi, Sol, Si, Ré, Fá; spaces: Fá, Lá, Dó, Mi.
export const STAFF_TIPS = {
  C4: 'O Dó fica numa linha pequenininha, embaixo da pauta.',
  D4: 'O Ré fica pendurado logo embaixo da primeira linha.',
  E4: 'O Mi mora na primeira linha, a de baixo.',
  F4: 'O Fá mora no primeiro espaço, entre duas linhas.',
  G4: 'O Sol mora na segunda linha, onde a clave de sol se enrola.',
  A4: 'O Lá mora no segundo espaço.',
  B4: 'O Si mora na linha do meio.',
  C5: 'O Dó agudo mora no terceiro espaço.',
  D5: 'O Ré agudo mora na quarta linha.',
  E5: 'O Mi agudo mora no último espaço, lá em cima.',
  F5: 'O Fá agudo mora na quinta linha, a mais alta.',
  G5: 'O Sol agudo fica sentadinho em cima da pauta.',
  'F#5': 'O Fá sustenido fica na linha do Fá agudo, com o ♯ na frente. É a tecla preta logo à direita do Fá.',
};

export const TIPS = {
  colors: { art: '🌈', title: 'Cada nota tem uma cor', text: 'Oi! Eu sou a Nina, a notinha. No nosso piano cada nota tem uma cor e um desenho. Vamos conhecer as três primeiras!' },
  sevenNotes: { art: '🎹', title: 'Sete notas', text: 'A música toda é feita com sete notas: Dó, Ré, Mi, Fá, Sol, Lá e Si. Depois do Si, começa outro Dó!' },
  twoBlack: { title: 'As duas teclas pretas', text: 'Agora sem cores, igual a um piano de verdade! As teclas pretas vêm em grupos de duas e de três. O Dó fica sempre logo antes das duas pretas.', keys: 'plain', highlight: [C, C5] },
  threeBlack: { title: 'As três teclas pretas', text: 'O Fá fica sempre logo antes das três teclas pretas. Achou o grupo de três? O Fá está do lado esquerdo dele.', keys: 'plain', highlight: [F] },
  highLow: { art: '🐻 🐦', title: 'Grave e agudo', text: 'Sons graves são grossos, como um urso. Sons agudos são fininhos, como um passarinho. Toque nos botões para ouvir.', sounds: [['🐻 Grave', [['C3', 1.5]]], ['🐦 Agudo', [['C6', 1.5]]]] },
  upDown: { art: '⬆️ ⬇️', title: 'Subindo e descendo', text: 'No piano, quanto mais para a direita, mais agudo o som. Se as notas vão para a direita, a melodia sobe. Para a esquerda, ela desce.', sounds: [['⬆️ Sobe', [[C, 1], [E, 1], [G, 1]]], ['⬇️ Desce', [[G, 1], [E, 1], [C, 1]]]] },
  sameDiff: { art: '👂', title: 'Igual ou diferente', text: 'Agora vou tocar duas notas. Escute bem: elas são iguaizinhas ou diferentes?', sounds: [['🟰 Iguais', [[E, 1], ['rest', 0.4], [E, 1]]], ['↔️ Diferentes', [[C, 1], ['rest', 0.4], [A, 1]]]] },
  echo: { art: '🦜', title: 'Brincar de papagaio', text: 'Eu toco e as teclas acendem. Depois você toca igualzinho! Se errar, eu toco de novo para você.' },
  beat: { art: '🥁', title: 'O tempo da música', text: 'Toda música tem um pulso, como o coração: tum, tum, tum. Cada batida é um tempo. Vamos bem devagarinho!' },
  staff: { title: 'A pauta', text: 'A música se escreve numa pauta de cinco linhas. Cada nota tem sua casinha: numa linha ou num espaço. Quanto mais alta na pauta, mais agudo o som.', staff: [C, E, G, C5] },
  dictation: { title: 'Ditado da pauta', text: 'Agora é ao contrário: eu falo o nome da nota e você acha onde ela mora na pauta.', staff: [D, F, A] },
  lines: { title: 'Notas na linha', text: 'Quando a linha passa bem no meio da bolinha, como um espetinho, a nota está numa linha.', staff: [E, G, B], labels: true },
  spaces: { title: 'Notas no espaço', text: 'Quando a bolinha fica entre duas linhas, sem nenhuma linha passando por ela, a nota está num espaço.', staff: [F, A, C5], labels: true },
  lineNotes: { title: 'As notas das linhas', text: 'As três primeiras linhas, de baixo para cima, são: Mi, Sol e Si. Uma linha sim, uma linha não!', staff: [E, G, B], labels: true },
  spaceNotes: { title: 'As notas dos espaços', text: 'Os três primeiros espaços, de baixo para cima, são: Fá, Lá e Dó.', staff: [F, A, C5], labels: true },
  higher: { title: 'Mais alto, mais agudo', text: 'Na pauta, quanto mais para cima a nota está, mais agudo é o som. Mais para baixo, mais grave.', staff: [C, G, C5, E], sounds: [['🔊 Ouvir', [[C, 1], [G, 1], [C5, 1], [E, 1]]]] },
  songsOnStaff: { title: 'Músicas na partitura', text: 'Agora você vai ler o começo de músicas que já conhece. Leia nota por nota, da esquerda para a direita!', staff: [E, D, C, D, E] },
  highNotes: { title: 'Lá em cima da pauta', text: 'A pauta continua subindo! Depois do Dó agudo vêm o Ré, o Mi, o Fá e o Sol agudos. O teclado agora ficou maior.', staff: [C5, D5, E5, F5, G5], labels: true, wide: true },
  wholeStaff: { title: 'A pauta inteira', text: 'As cinco linhas, de baixo para cima: Mi, Sol, Si, Ré, Fá. Os quatro espaços: Fá, Lá, Dó, Mi.', staff: [E, G, B, D5, F5], labels: true },
  jumps: { title: 'Pulando degraus', text: 'Às vezes a melodia não anda de vizinho em vizinho: ela pula! Dó, Mi, Sol é um pulo de linha em linha.', staff: [C, E, G, C5], labels: true },
  scale: { title: 'A escada das notas', text: 'Escala é uma escada de notas! Cada degrau é a nota vizinha: Dó, Ré, Mi, Fá, Sol, Lá, Si e Dó de novo. Subindo a escada, o som fica mais agudo.', stairs: C_SCALE, sounds: [['🔊 Ouvir a escala', C_SCALE.map(n => [n, 0.75])]] },
  scaleDown: { title: 'Descendo a escada', text: 'Descer a escada é tocar de trás para frente: Dó, Si, Lá, Sol, Fá, Mi, Ré, Dó. O som vai ficando mais grave.', stairs: [...C_SCALE].reverse(), sounds: [['🔊 Ouvir descendo', [...C_SCALE].reverse().map(n => [n, 0.75])]] },
  halfStep: { title: 'Vizinhos colados', text: 'Quase todas as teclas brancas têm uma tecla preta no meio. Mas o Mi e o Fá são vizinhos colados, sem tecla preta! O Si e o Dó também.', keys: 'full', highlight: [E, F, B, C5] },
  order: { art: '🪜', title: 'Em ordem!', text: 'A escada tem uma ordem certinha: Dó, Ré, Mi, Fá, Sol, Lá, Si. Vou misturar as notas e você coloca na ordem.' },
  fiveFingers: { title: 'Cinco dedinhos', text: 'Pianistas começam com cinco notas, uma para cada dedo: Dó, Ré, Mi, Fá, Sol. O polegar fica no Dó!', stairs: [C, D, E, F, G] },
  scaleStaff: { title: 'A escala na partitura', text: 'Na pauta a escala também é uma escada: linha, espaço, linha, espaço… cada nota um degrau acima da outra.', staff: C_SCALE, labels: true },
  gScale: { title: 'A escala de Sol', text: 'Uma escala pode começar em outra nota! A escala de Sol vai do Sol até o Sol agudo. Para soar certinha, o Fá vira Fá sustenido: a tecla preta.', stairs: G_SCALE, wide: true, sounds: [['🔊 Ouvir a escala de Sol', G_SCALE.map(n => [n, 0.75])]] },
  songs: { art: '🎵', title: 'Hora do show', text: 'Primeiro a gente escuta a música inteira. Depois você toca um pedacinho de cada vez. No fim, ela toda!' },
};

export const RHYTHM_LEARN = {
  1: { title: 'Semínima: tá', text: 'Esta nota dura um tempo. Quando ela aparece, a gente fala "tá"!', pattern: [1, 1, 1, 1] },
  2: { title: 'Mínima: tá-a', text: 'Esta nota é vazia por dentro e dura dois tempos. A gente fala "tá-a" e segura.', pattern: [2, 2] },
  0.5: { title: 'Colcheias: ti-ti', text: 'Duas colcheias juntinhas cabem num tempo só. São rapidinhas: "ti-ti"!', pattern: [0.5, 0.5, 0.5, 0.5, 1, 1] },
};

export const EAR = {
  highLow: 'Esse som é grave ou agudo?',
  upDown: 'A melodia subiu ou desceu?',
  upDownScale: 'A escada subiu ou desceu?',
  sameDiff: 'As duas notas são iguais ou diferentes?',
};

/** "Dó agudo" for the notes from the Dó in the third space upwards, so both Dós can be told apart. */
export const staffLabel = note => `${nameOf(note.replace(/-?\d+$/, ''))}${Number(note.match(/-?\d+$/)[0]) >= 5 ? ' agudo' : ''}`;

export const LINES = {
  tip: tip => `${tip.title}. ${tip.text}`,
  introNote: pc => `Este é o ${NOTE_INFO[pc].name}, de ${NOTE_INFO[pc].word}!`,
  touch: name => `Toque o ${name}`,
  whichNote: 'Que nota é esta?',
  echoListen: 'Olhe e escute',
  echoPlay: 'Agora você! Toque igual.',
  rhythmWhich: 'Qual ritmo você ouviu?',
  drum: guide => (guide ? 'Toque o tambor junto com o som' : 'Toque o tambor no ritmo'),
  staffPlay: 'Que nota é essa? Toque no piano.',
  staffName: 'Qual é o nome desta nota?',
  staffSeq: 'Leia e toque as notas, uma por uma.',
  staffLines: 'A nota está numa linha ou num espaço?',
  compare: ask => `Qual nota é mais ${ask === 'high' ? 'aguda' : 'grave'}?`,
  where: note => `Onde mora o ${staffLabel(note)}?`,
  climb: (dir, guide) => `${dir === 'down' ? 'Desça' : 'Suba'} a escada${guide ? '' : ' sozinho'}`,
  fiveFingers: 'Toque os cinco dedinhos',
  missing: 'Qual nota está faltando na escada?',
  neighbor: (next, name) => `Na escada, qual nota vem ${next ? 'depois' : 'antes'} do ${name}?`,
  halfStep: (a, b) => `Entre o ${a} e o ${b} tem tecla preta?`,
  order: up => `Toque as notas em ordem, ${up ? 'subindo' : 'descendo'} a escada`,
  lessonDone: 'Lição completa!',
  discovered: pc => `${NOTE_INFO[pc].name}, de ${NOTE_INFO[pc].word}!`,
  whereIs: pc => `Cadê o ${NOTE_INFO[pc].name}?`,
  hello: 'Oi! Eu sou a Nina, a notinha! Vamos tocar juntos?',
  bravo: three => (three ? 'Parabéns! Três estrelas!' : 'Parabéns!'),
};

/** Every line Nina can say: what scripts/nina-voice records. */
export function allVoiceLines() {
  const names = [...WHITE.map(nameOf), nameOf('F#')];
  const pairs = [['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'G'], ['G', 'A'], ['A', 'B'], ['B', 'C']];
  const lines = [
    ...Object.values(TIPS).map(LINES.tip),
    ...WHITE.map(LINES.introNote),
    ...names.map(LINES.touch),
    LINES.whichNote, ...Object.values(EAR), LINES.echoListen, LINES.echoPlay,
    ...Object.values(RHYTHM_LEARN).map(r => r.text), LINES.rhythmWhich, LINES.drum(true), LINES.drum(false),
    ...Object.values(STAFF_TIPS),
    LINES.staffPlay, LINES.staffName, LINES.staffSeq, LINES.staffLines, LINES.compare('high'), LINES.compare('low'),
    ...[C, D, E, F, G, A, B, C5, D5, E5, F5, G5].map(LINES.where),
    ...['up', 'down'].flatMap(dir => [true, false].map(guide => LINES.climb(dir, guide))), LINES.fiveFingers, LINES.missing,
    ...[true, false].flatMap(next => names.map(name => LINES.neighbor(next, name))),
    ...pairs.map(([a, b]) => LINES.halfStep(nameOf(a), nameOf(b))),
    LINES.order(true), LINES.order(false), LINES.lessonDone,
    ...WHITE.map(LINES.discovered), ...WHITE.map(LINES.whereIs), LINES.hello, LINES.bravo(true), LINES.bravo(false),
  ];
  return [...new Set(lines)];
}

/** What the speech engine reads: the musical signs spelled out. */
export const ttsText = text => text.replace(/♯/g, ' sustenido').replace(/♭/g, ' bemol');
/** Stable short id of a line (FNV-1a), used as the recording's file name. */
export function lineId(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
