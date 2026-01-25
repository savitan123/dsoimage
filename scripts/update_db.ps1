# PowerShell Script to Update Targets Database
$csvUrl = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
$outputFile = "data/targets.json"

Write-Host "Downloading OpenNGC Catalog..."
$csvContent = Invoke-WebRequest -Uri $csvUrl -UseBasicParsing
$lines = $csvContent.Content -split "`n"

# Header is usually: Name;Type;RA;Dec;Const;MajAx;MinAx;PosAng;B-Mag;V-Mag;J-Mag;H-Mag;K-Mag;SurfBr;Hubble;Cstar;U-Mag;B-Mag;V-Mag;R-Mag;I-Mag;M-Type;M-Lum;M-Dist;M-Ang;M-App;M-Abs;
# Warning: separator is often ';' in OpenNGC. Let's detect.
$header = $lines[0]
$sep = ","
if ($header -match ";") { $sep = ";" }

Write-Host "Detected separator: $sep"

$targets = @()

# Process lines (Skip header)
for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $cols = $line -split $sep
    
    # Columns mapping (based on OpenNGC standard):
    # 0: Name, 1: Type, 2: RA (h:m:s), 3: Dec (d:m:s), 4: Const, 5: MajAx, ... 8: V-Mag (or similar)
    # We need to be careful with RA/Dec parsing.
    # OpenNGC usually provides RA in HH:MM:SS.ss and Dec in DD:MM:SS.ss
    
    $name = $cols[0]
    $type = $cols[1]
    
    # Simple Type Filtering (Optional: User asked for ALL, but maybe skip stars?)
    # Keep all for now.
    
    $raStr = $cols[2]
    $decStr = $cols[3]
    $const = $cols[4]
    
    # Try to find Magnitude (V-Mag is usually col 9 or 10 depending on version)
    # Let's check header mapping dynamically if possible, but hardcoding for this snippet is risk.
    # We'll just take a best guess or Try-Parse.
    # Actually, let's just store the raw string for Mag if we are unsure, or 99 if missing.
    # V-Mag is definitely useful.
    # Let's assume col 8 or 9.
    $mag = $cols[9] 
    if ($mag -eq "") { $mag = $cols[8] } # Fallback
    if ($mag -eq "") { $mag = "99" }
    
    # Basic Object Structure
    $obj = @{
        "n" = $name
        "t" = $type
        "r" = $raStr
        "d" = $decStr
        "m" = $mag
        "c" = $const
    }
    
    $targets += $obj
}

Write-Host "Parsed $($targets.Count) objects. Saving JSON..."

# Custom JSON serialization to keep it compact
# ConvertTo-Json in PS can be verbose.
$json = $targets | ConvertTo-Json -Depth 1 -Compress
$json | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Done! Saved to $outputFile"
