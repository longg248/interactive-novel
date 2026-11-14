$ErrorActionPreference = 'Stop'
$dir = 'public\data\story\nodes'
$index = Get-Content "$dir\index.json" -Raw | ConvertFrom-Json
$ok = $true

Write-Output "=== Nodes listed in index.json ==="
foreach ($id in $index) {
    $path = "$dir\$id.json"
    if (-not (Test-Path $path)) {
        Write-Output "  MISSING FILE: $id"
        $ok = $false
        continue
    }
    $node = Get-Content $path -Raw | ConvertFrom-Json
    if ($node.id -ne $id) { Write-Output "  ID MISMATCH: file=$id json.id=$($node.id)"; $ok = $false }
    Write-Output "  OK $id (type=$($node.type), paragraphs=$($node.content.paragraphs.Count), transitions=$($node.transitions.Count))"
}

Write-Output ""
Write-Output "=== Transition targets ==="
foreach ($id in $index) {
    $path = "$dir\$id.json"
    if (-not (Test-Path $path)) { continue }
    $node = Get-Content $path -Raw | ConvertFrom-Json
    foreach ($t in $node.transitions) {
        if ($t.targetNodeId -notin $index) {
            Write-Output "  BROKEN: $id -> $($t.targetNodeId) (not in index)"
            $ok = $false
        } else {
            Write-Output "  OK  $id -> $($t.targetNodeId) [choice=$($t.choiceId) type=$($t.type) text=$($t.text)]"
        }
    }
}

Write-Output ""
Write-Output "=== Orphan nodes (on disk, not in index) ==="
$onDisk = Get-ChildItem "$dir\*.json" | Where-Object { $_.BaseName -ne 'index' } | ForEach-Object { $_.BaseName }
foreach ($f in $onDisk) {
    if ($f -notin $index) { Write-Output "  ORPHAN: $f"; $ok = $false }
}

Write-Output ""
Write-Output "=== Unreachable nodes ==="
$reachable = @{}
$queue = New-Object System.Collections.ArrayList
$null = $queue.Add($index[0])
while ($queue.Count -gt 0) {
    $cur = $queue[0]
    $queue.RemoveAt(0)
    if ($reachable[$cur]) { continue }
    $reachable[$cur] = $true
    $path = "$dir\$cur.json"
    if (-not (Test-Path $path)) { continue }
    $node = Get-Content $path -Raw | ConvertFrom-Json
    foreach ($t in $node.transitions) { if ($t.targetNodeId -in $index) { $null = $queue.Add($t.targetNodeId) } }
}
foreach ($id in $index) {
    if (-not $reachable[$id]) { Write-Output "  UNREACHABLE from '$($index[0])': $id"; $ok = $false }
}

Write-Output ""
if ($ok) { Write-Output "RESULT: ALL CHECKS PASSED" } else { Write-Output "RESULT: PROBLEMS FOUND"; exit 1 }
