// Converts a Standard MIDI File into an Allegretto song: a single melody line fitted to the
// piano's 25 keys (C4–C6). Pure JS with no browser APIs, so it also runs under Node for testing.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LOWEST = 60;  // C4
const HIGHEST = 84; // C6
// Note values the lessons, training and staff all know how to draw, in beats (quarter = 1).
const DURATIONS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
const DRUM_CHANNEL = 9;
// Left hand: everything below middle C, shown on the bass staff and played as accompaniment.
const BASS_CEILING = 60; // C4 belongs to the melody
const BASS_FLOOR = 36;   // C2: lower notes are folded up an octave so they stay readable on the bass staff

export class MidiImportError extends Error {}

const midiToName = midi => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/** Parses the parts of an SMF the importer needs: notes (in ticks), first tempo, first time signature. */
export function parseMidi(buffer) {
  const view = new DataView(buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  let pos = 0;
  const u8 = () => view.getUint8(pos++);
  const u16 = () => { const v = view.getUint16(pos); pos += 2; return v; };
  const u32 = () => { const v = view.getUint32(pos); pos += 4; return v; };
  const tag = () => String.fromCharCode(u8(), u8(), u8(), u8());
  const vlq = () => { let v = 0; let b; do { b = u8(); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };

  if (view.byteLength < 14 || tag() !== 'MThd') throw new MidiImportError('Este arquivo não é um MIDI.');
  const headerLength = u32();
  u16(); // format
  const trackCount = u16();
  const division = u16();
  if (division & 0x8000) throw new MidiImportError('MIDI com tempo SMPTE não é suportado.');
  pos = 8 + headerLength;

  const notes = [];
  let tempo = null;
  let timeSignature = null;
  for (let t = 0; t < trackCount && pos + 8 <= view.byteLength; t += 1) {
    const id = tag();
    const length = u32();
    const end = Math.min(view.byteLength, pos + length);
    if (id !== 'MTrk') { pos = end; continue; }
    let tick = 0;
    let running = 0;
    const open = new Map(); // "channel:pitch" -> [{start, velocity}]
    while (pos < end) {
      tick += vlq();
      let status = view.getUint8(pos);
      if (status & 0x80) pos += 1; else status = running;
      if (status === 0xff) {
        const type = u8();
        const len = vlq();
        if (type === 0x51 && len === 3 && tempo == null) tempo = (view.getUint8(pos) << 16) | (view.getUint8(pos + 1) << 8) | view.getUint8(pos + 2);
        if (type === 0x58 && len >= 2 && timeSignature == null) timeSignature = [view.getUint8(pos), 2 ** view.getUint8(pos + 1)];
        pos += len;
        running = 0;
        if (type === 0x2f) break;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) { pos += vlq(); running = 0; continue; }
      if (!(status & 0x80)) throw new MidiImportError('O arquivo MIDI está corrompido.');
      running = status;
      const kind = status & 0xf0;
      const channel = status & 0x0f;
      const a = u8();
      const b = kind === 0xc0 || kind === 0xd0 ? 0 : u8();
      const key = `${channel}:${a}`;
      if (kind === 0x90 && b > 0) {
        if (!open.has(key)) open.set(key, []);
        open.get(key).push({ start: tick, velocity: b });
      } else if (kind === 0x80 || (kind === 0x90 && b === 0)) {
        const started = open.get(key)?.shift();
        if (started) notes.push({ pitch: a, channel, start: started.start, end: tick, velocity: started.velocity });
      }
    }
    // Notes never released close at the end of their track.
    for (const [key, list] of open) {
      const [channel, pitch] = key.split(':').map(Number);
      for (const started of list) notes.push({ pitch, channel, start: started.start, end: tick, velocity: started.velocity });
    }
    pos = end;
  }
  return { division, tempo: tempo ?? 500000, timeSignature: timeSignature ?? [4, 4], notes };
}

/**
 * Picks the melody: the highest note of each onset, skipping accompaniment that sounds under a
 * melody note still being held or that drops well below the line's recent register.
 */
function extractMelody(notes, division) {
  const tolerance = division / 8; // a 32nd note
  const sorted = notes.filter(n => n.channel !== DRUM_CHANNEL && n.end > n.start)
    .sort((a, b) => a.start - b.start || b.pitch - a.pitch);
  const tops = [];
  for (const note of sorted) {
    const last = tops[tops.length - 1];
    if (last && note.start - last.groupStart <= tolerance) {
      if (note.pitch > last.note.pitch) last.note = note;
    } else {
      tops.push({ groupStart: note.start, note });
    }
  }
  const melody = [];
  for (const { note } of tops) {
    const current = melody[melody.length - 1];
    const recent = melody.slice(-6);
    const register = recent.length ? recent.reduce((sum, n) => sum + n.pitch, 0) / recent.length : note.pitch;
    const underHeldNote = current && note.start < current.end - tolerance && note.pitch < current.pitch - 4;
    // A big drop below the line is usually accompaniment, unless it stays in the treble and sounds
    // completely alone: then it is the melody leaping down (e.g. an octave echo in a solo intro).
    // Left-hand arpeggios also sound one note at a time, which is why the register check matters.
    const alone = !sorted.some(other => other !== note && other.start <= note.start + tolerance && other.end > note.start + tolerance);
    const melodicLeap = alone && note.pitch >= BASS_CEILING;
    const dropsToBass = recent.length >= 3 && note.pitch < register - 10 && !melodicLeap;
    if (underHeldNote || dropsToBass) continue;
    melody.push(note);
  }
  return melody;
}

const nearestDuration = beats => DURATIONS.reduce((best, d) => (Math.abs(d - beats) < Math.abs(best - beats) ? d : best));

const quarterBeat = beats => Math.round(beats * 4) / 4;

/**
 * Maps MIDI ticks onto the song's own beat timeline. Melody rhythms were rounded, so the original
 * tick → beat ratio drifts; anchoring on each melody onset keeps the two hands together.
 */
function makeTickToBeat(melody, songNotes, division) {
  const anchors = [];
  let beat = 0;
  melody.forEach((note, i) => { anchors.push([note.start, beat]); beat += songNotes[i][1]; });
  const lastNote = melody[melody.length - 1];
  anchors.push([Math.max(lastNote.end, lastNote.start + 1), beat]);
  return tick => {
    if (tick <= anchors[0][0]) return (tick - anchors[0][0]) / division;
    for (let i = 1; i < anchors.length; i += 1) {
      const [t1, b1] = anchors[i];
      if (tick <= t1) {
        const [t0, b0] = anchors[i - 1];
        return b0 + ((tick - t0) / (t1 - t0)) * (b1 - b0);
      }
    }
    const [tLast, bLast] = anchors[anchors.length - 1];
    return bLast + (tick - tLast) / division;
  };
}

function extractBass(notes, melody, songNotes, division) {
  const inMelody = new Set(melody);
  const toBeat = makeTickToBeat(melody, songNotes, division);
  const bass = [];
  for (const note of notes) {
    if (inMelody.has(note) || note.channel === DRUM_CHANNEL || note.pitch >= BASS_CEILING) continue;
    const start = quarterBeat(toBeat(note.start));
    if (start < 0) continue; // before the melody starts: nothing to line it up with
    const dur = Math.min(4, Math.max(0.25, quarterBeat(toBeat(note.end) - toBeat(note.start))));
    let pitch = note.pitch;
    while (pitch < BASS_FLOOR) pitch += 12;
    bass.push([midiToName(pitch), start, dur]);
  }
  // One entry per pitch per moment: doubled notes in the arrangement would just stack on the staff.
  const seen = new Set();
  return bass
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .filter(([name, start]) => { const key = `${name}@${start}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

/** Octave shift that keeps the most notes on the keyboard; anything left over is folded in by octaves. */
function fitToKeyboard(pitches) {
  let shift = 0;
  let bestFit = -1;
  for (let s = -48; s <= 48; s += 12) {
    const fit = pitches.filter(p => p + s >= LOWEST && p + s <= HIGHEST).length;
    if (fit > bestFit || (fit === bestFit && Math.abs(s) < Math.abs(shift))) { shift = s; bestFit = fit; }
  }
  const fold = p => { let q = p + shift; while (q < LOWEST) q += 12; while (q > HIGHEST) q -= 12; return q; };
  return { shift, folded: pitches.length - bestFit, fold };
}

/** "Alicia - Clair Obscur_ Expedition 33.mid" → { title: 'Alicia', artist: 'Clair Obscur: Expedition 33' } */
export function titleFromFileName(fileName) {
  // Windows can't store ":" in file names, so downloads usually turn "Name: Subtitle" into "Name_ Subtitle".
  // Strip every trailing extension: downloads are often renamed to "song.mid.mid".
  const base = fileName.replace(/(\.(mid|midi))+$/i, '').replace(/_ /g, ': ').replace(/_/g, ' ').trim();
  const [title, ...rest] = base.split(' - ');
  return { title: title.trim() || 'Música importada', artist: rest.join(' - ').trim() || 'MIDI importado' };
}

/** Full conversion. Returns the song plus a short report the import dialog shows. */
export function midiToSong(buffer, fileName = 'musica.mid') {
  const { division, tempo, timeSignature, notes } = parseMidi(buffer);
  const melody = extractMelody(notes, division);
  if (melody.length < 2) throw new MidiImportError('Não encontrei uma melodia neste arquivo.');

  const { shift, folded, fold } = fitToKeyboard(melody.map(n => n.pitch));
  const songNotes = melody.map((note, i) => {
    const next = melody[i + 1];
    // Silence before the next note is folded into this one: lessons and training have no rests.
    const beats = (next ? next.start - note.start : note.end - note.start) / division;
    return [midiToName(fold(note.pitch)), nearestDuration(Math.min(beats, 4))];
  });

  const bass = extractBass(notes, melody, songNotes, division);
  const bpm = Math.min(220, Math.max(30, Math.round(60000000 / tempo)));
  const totalBeats = songNotes.reduce((sum, [, d]) => sum + d, 0);
  const notesPerSecond = songNotes.length / (totalBeats * 60 / bpm);
  const { title, artist } = titleFromFileName(fileName);
  return {
    song: {
      id: `midi-${Date.now()}`,
      title,
      artist,
      difficulty: notesPerSecond < 1.6 ? 1 : notesPerSecond < 3 ? 2 : 3,
      bpm,
      timeSignature: `${timeSignature[0]}/${timeSignature[1]}`,
      notes: songNotes,
      // Left hand as [name, startBeat, durationBeats]; may overlap (chords), unlike the melody.
      bass,
      source: 'midi',
    },
    report: {
      sourceNotes: notes.length,
      melodyNotes: songNotes.length,
      bassNotes: bass.length,
      // Measure where the left hand comes in, so a long solo intro doesn't look like a missing part.
      bassStartMeasure: bass.length ? Math.floor(bass[0][1] / (timeSignature[0] * (4 / timeSignature[1]))) + 1 : null,
      octaveShift: shift / 12,
      folded,
      seconds: Math.round(totalBeats * 60 / bpm),
    },
  };
}
