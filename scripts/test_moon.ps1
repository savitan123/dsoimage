$synodic = 29.53058867
# Jan 18, 2026 17:55 UTC
$knownNewMoon = (Get-Date "2026-01-18T17:55:00Z").ToUniversalTime()

for ($day = 1; $day -le 28; $day++) {
    # Using noon UTC
    $targetDateStr = "2026-02-$($day.ToString('00'))T12:00:00Z"
    $targetDate = (Get-Date $targetDateStr).ToUniversalTime()
    
    $diff = $targetDate - $knownNewMoon
    $diffDays = $diff.TotalDays
    
    $phase = $diffDays % $synodic
    if ($phase -lt 0) {
        $phase += $synodic
    }
    
    $fraction = $phase / $synodic
    
    $distToNew = [Math]::Min($fraction, 1.0 - $fraction)
    $distToFull = [Math]::Abs($fraction - 0.5)
    
    $THRESHOLD = 0.5 / $synodic
    
    $marker = ""
    if ($distToNew -le $THRESHOLD) {
        $marker = "🌑 NEW MOON!"
    }
    elseif ($distToFull -le $THRESHOLD) {
        $marker = "🌕 FULL MOON!"
    }
    
    $fracFmt = "{0:N4}" -f $fraction
    Write-Host "Feb ${day}: phase=$fracFmt | $marker"
}
