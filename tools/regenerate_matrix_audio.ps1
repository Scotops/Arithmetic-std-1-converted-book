param(
  [string[]]$Pages = @('060','064','071','072','073','091','096','099','101','108','118','122','126','127','128','131','132')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

if ($env:ADT_AUDIO_PAGES) {
  $Pages = $env:ADT_AUDIO_PAGES.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)
}

$textsPath = Join-Path $PSScriptRoot '..\content\i18n\en-US\texts.json'
$audiosPath = Join-Path $PSScriptRoot '..\content\i18n\en-US\audios.json'
$audioDir = Join-Path $PSScriptRoot '..\content\i18n\en-US\audio'
$texts = Get-Content -LiteralPath $textsPath -Raw | ConvertFrom-Json -AsHashtable
$audios = Get-Content -LiteralPath $audiosPath -Raw | ConvertFrom-Json -AsHashtable

function Number-Words([int]$Number) {
  $ones = @('zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen')
  $tens = @('','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety')
  if ($Number -lt 20) { return $ones[$Number] }
  if ($Number -lt 100) { return $tens[[math]::Floor($Number / 10)] + $(if ($Number % 10) { '-' + $ones[$Number % 10] } else { '' }) }
  if ($Number -lt 1000) { return $ones[[math]::Floor($Number / 100)] + ' hundred' + $(if ($Number % 100) { ' ' + (Number-Words ($Number % 100)) } else { '' }) }
  return [string]$Number
}

function Speech-Text([string]$Html) {
  $text = $Html -replace "<span[^>]*adt-blank-line[^>]*></span>", ' dash '
  $text = $text -replace '<[^>]+>', ' '
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  $text = $text -replace '_', ' dash '
  $text = $text -replace '−|–', ' minus '
  $text = $text -replace '-\s*=', ' minus dash equals '
  $text = $text -replace '\+\s*=', ' plus dash equals '
  $text = $text -replace '(?<=\d)\s*-\s*(?=\d)', ' minus '
  $text = $text -replace '\+', ' plus '
  $text = $text -replace '=', ' equals '
  $text = $text -replace '÷', ' divided by '
  $text = $text -replace '×', ' multiplied by '
  $text = [regex]::Replace($text, '(?<![A-Za-z])\d+(?![A-Za-z])', {
    param($m)
    if ($m.Value.Length -gt 3) { return $m.Value }
    return Number-Words ([int]$m.Value)
  })
  return ($text -replace '\s+', ' ').Trim()
}

$ids = [System.Collections.Generic.HashSet[string]]::new()
foreach ($page in $Pages) {
  Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '..') -Filter "pg$page`_sec*.html" | ForEach-Object {
    $html = Get-Content -LiteralPath $_.FullName -Raw
    [regex]::Matches($html, 'data-id=\W*([A-Za-z0-9_-]+)') | ForEach-Object { [void]$ids.Add($_.Groups[1].Value) }
  }
}

$voice = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$voice.SelectVoice('Microsoft David Desktop')
$voice.Rate = 0
$voice.Volume = 100
$spokenOverrides = @{
  'pg003_n0006' = 'Roman numeral five.'
  'pg003_n0009' = 'Roman numeral six.'
  'pg035_n0043' = 'Eight plus dash equals nine.'
}
$count = 0
foreach ($id in $ids | Sort-Object) {
  if (-not $texts.ContainsKey($id)) { continue }
  $spoken = if ($spokenOverrides.ContainsKey($id)) { $spokenOverrides[$id] } else { Speech-Text ([string]$texts[$id]) }
  if (-not $spoken) { continue }
  $filename = "$id.matrix-20260824.wav"
  $voice.SetOutputToWaveFile((Join-Path $audioDir $filename))
  $voice.Speak($spoken)
  $voice.SetOutputToNull()
  $audios[$id] = "$filename`?matrix-audio-20260824"
  $count++
}
$voice.Dispose()
$texts | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $textsPath -Encoding utf8
$audios | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $audiosPath -Encoding utf8
Write-Output "Regenerated $count single-voice recordings."
