$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$workDir = Join-Path $root "public\works\motion-rules"
$input = Join-Path $workDir "motion-rules.mp4"
$tmpOut = Join-Path $workDir "motion-rules.tmp.mp4"
$cover = Join-Path $workDir "cover.jpg"

function Resolve-FfmpegPath {
  $cmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $candidates = @(
    (Join-Path $root ".tools\ffmpeg\ffmpeg.exe"),
    (Join-Path $root ".tools\ffmpeg\bin\ffmpeg.exe")
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }

  throw "ffmpeg not found. Install ffmpeg and add to PATH, or place ffmpeg.exe at .tools/ffmpeg/ffmpeg.exe"
}

if (!(Test-Path $input)) {
  throw "Input not found: $input"
}

$ffmpeg = Resolve-FfmpegPath
Write-Host "Using ffmpeg:" $ffmpeg

# 1) Trim video to 00:02:54 (delete everything after).
& $ffmpeg -y -hide_banner -loglevel error `
  -i $input `
  -to 00:02:54 `
  -c:v libx264 -preset veryfast -crf 20 `
  -c:a aac -b:a 192k `
  $tmpOut

Move-Item -Force $tmpOut $input
Write-Host "Trimmed video:" $input

# 2) Extract cover frame at 00:00:18
& $ffmpeg -y -hide_banner -loglevel error `
  -ss 00:00:18 -i $input `
  -frames:v 1 -q:v 2 `
  $cover

Write-Host "Cover saved:" $cover

