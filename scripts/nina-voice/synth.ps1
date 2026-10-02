# Step 2 of Nina's voice: records every line with a Windows voice (Maria, pt-BR) as WAV.
# It speaks a little slower and as high as the voice goes; childify.py then speeds the audio up, which
# raises pitch and timbre together and brings the pace back to a child's.
param(
  [string]$Voice = 'Microsoft Maria Desktop',
  [int]$Rate = -1,
  [string]$Pitch = '+20%'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$build = Join-Path $here 'build'
$wavDir = Join-Path $build 'wav'
New-Item -ItemType Directory -Force $wavDir | Out-Null
$lines = Get-Content (Join-Path $build 'lines.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice($Voice)
$synth.Rate = $Rate
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

foreach ($line in $lines) {
  $text = [System.Security.SecurityElement]::Escape($line.text)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><prosody pitch='$Pitch'>$text</prosody></speak>"
  $synth.SetOutputToWaveFile((Join-Path $wavDir "$($line.id).wav"), $format)
  $synth.SpeakSsml($ssml)
}
$synth.SetOutputToNull()
$synth.Dispose()
Write-Output "$($lines.Count) falas gravadas em $wavDir"
