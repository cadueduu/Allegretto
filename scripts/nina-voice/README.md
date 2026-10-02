# Voz da Nina

Gera as falas do Modo Infantil como áudio com voz de criança.

1. `lines.mjs` lista tudo o que a Nina fala, a partir de `src/kids/texts.js`.
2. `synth.ps1` grava cada fala com a voz Maria do Windows (pt-BR), um pouco mais devagar e no tom mais agudo que ela alcança.
3. `childify.py` acelera cada gravação (fator 1,4). Acelerar sobe o tom e o timbre juntos, que é o que separa uma voz de criança de um adulto falando fino. Depois corta os silêncios, iguala o volume e salva em MP3 em `public/voice/`, além de atualizar `src/kids/voiceClips.js`.

Precisa de Windows, Node e Python com `numpy` e `lameenc`. Para gerar tudo:

```bash
npm run voz-nina
```

Para testar outro fator: `python scripts/nina-voice/childify.py 1.3` (mais grave) ou `1.5` (mais fino).
