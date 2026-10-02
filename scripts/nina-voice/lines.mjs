// Step 1 of Nina's voice: lists everything she says (from src/kids/texts.js) for synth.ps1 to record.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allVoiceLines, lineId, ttsText } from '../../src/kids/texts.js';

const build = join(dirname(fileURLToPath(import.meta.url)), 'build');
mkdirSync(build, { recursive: true });
const lines = allVoiceLines().map(text => ({ id: lineId(text), text: ttsText(text) }));
writeFileSync(join(build, 'lines.json'), JSON.stringify(lines, null, 2));
console.log(`${lines.length} falas listadas em ${join(build, 'lines.json')}`);
