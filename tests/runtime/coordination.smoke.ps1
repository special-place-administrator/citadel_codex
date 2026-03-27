# Smoke test for runtime/scripts/coordination.js
# Usage: powershell -ExecutionPolicy Bypass -File tests/runtime/coordination.smoke.ps1

$ErrorActionPreference = "Stop"
$root = (git rev-parse --show-toplevel)
$script = Join-Path $root "runtime/scripts/coordination.js"
$failures = 0

Write-Host "=== Coordination Smoke Tests ===" -ForegroundColor Cyan

# Test 1: syntax check
Write-Host -NoNewline "  syntax check... "
try {
    node --check $script 2>&1 | Out-Null
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL" -ForegroundColor Red
    $failures++
}

# Test 2: status command runs without error
Write-Host -NoNewline "  status command... "
try {
    $out = node $script status 2>&1
    if ($LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    $failures++
}

# Test 3: sweep command runs without error
Write-Host -NoNewline "  sweep command... "
try {
    $out = node $script sweep 2>&1
    if ($LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    $failures++
}

# Test 4: help/no-args runs without error
Write-Host -NoNewline "  no-args help... "
try {
    $out = node $script 2>&1
    # May exit 0 or 1 depending on implementation, just check it runs
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    $failures++
}

Write-Host ""
if ($failures -eq 0) {
    Write-Host "All coordination smoke tests passed." -ForegroundColor Green
} else {
    Write-Host "$failures test(s) failed." -ForegroundColor Red
    exit 1
}
