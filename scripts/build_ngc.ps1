$url = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/OpenNGC/NGC.csv"
$outputPath = Join-Path $PSScriptRoot "..\data\ngc_ic.json"

Write-Host "Fetching OpenNGC data from GitHub..." -ForegroundColor Cyan

try {
    $tempFile = [System.IO.Path]::GetTempFileName()
    Invoke-WebRequest -Uri $url -OutFile $tempFile

    Write-Host "Data received. Parsing..." -ForegroundColor Cyan
    $csvData = Import-Csv -Path $tempFile -Delimiter ';'
    
    $results = @()

    foreach ($row in $csvData) {
        $entry = @{
            n  = $row.Name.Trim()
            t  = $row.Type.Trim()
            ra = $row.RA.Trim()
            de = $row.Dec.Trim()
            co = $row.Const.Trim()
            ma = $row.Mag.Trim()
            sz = "$($row.MajAx) x $($row.MinAx)".Trim(" x ")
            cn = if ($row.'Common names') { $row.'Common names'.Trim() } else { "" }
        }
        $results += $entry
    }

    $json = $results | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($outputPath, $json)

    Write-Host "Successfully generated $outputPath with $($results.Count) objects." -ForegroundColor Green
    Remove-Item $tempFile
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
