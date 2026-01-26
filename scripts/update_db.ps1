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
    
    # Size Data (MajAx, MinAx) - Cols 5 and 6 in OpenNGC
    $majAx = $cols[5]
    $minAx = $cols[6]
    
    # Try to find Magnitude (V-Mag/B-Mag)
    # Checking recent CSV structure, V-Mag is often col 8 or 10. 
    # Let's grab V-Mag (often col 8 after Maj/Min/PosAng/B-Mag?)
    # ...Actually header ref says: Name;Type;RA;Dec;Const;MajAx;MinAx;PosAng;B-Mag;V-Mag;...
    # So V-Mag is likely index 9 (0-based)
    $mag = $cols[9] 
    if ($mag -eq "") { $mag = $cols[8] } # Fallback B-Mag
    if ($mag -eq "") { $mag = "99" }
    
    # Basic Object Structure
    $obj = @{
        "n" = $name
        "t" = $type
        "r" = $raStr
        "d" = $decStr
        "m" = $mag
        "c" = $const
        "sz" = "$majAx x $minAx" # Compact size string
    }
    
    $targets += $obj
}

Write-Host "Parsed $($targets.Count) objects. Saving JSON..."

# Custom JSON serialization to keep it compact
# ConvertTo-Json in PS can be verbose.
$json = $targets | ConvertTo-Json -Depth 1 -Compress
$json | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Done! Saved to $outputFile"
