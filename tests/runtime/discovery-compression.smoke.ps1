# Smoke test for runtime/scripts/compress-discovery.cjs and parse-handoff.cjs
# Usage: powershell -ExecutionPolicy Bypass -File tests/runtime/discovery-compression.smoke.ps1

$ErrorActionPreference = "Stop"
$root = (git rev-parse --show-toplevel)
$failures = 0

Write-Host "=== Discovery & Compression Smoke Tests ===" -ForegroundColor Cyan

# Test 1: compress-discovery.cjs syntax check
$compress = Join-Path $root "runtime/scripts/compress-discovery.cjs"
Write-Host -NoNewline "  compress-discovery syntax... "
try {
    node --check $compress 2>&1 | Out-Null
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL" -ForegroundColor Red
    $failures++
}

# Test 2: parse-handoff.cjs syntax check
$handoff = Join-Path $root "runtime/scripts/parse-handoff.cjs"
Write-Host -NoNewline "  parse-handoff syntax... "
try {
    node --check $handoff 2>&1 | Out-Null
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL" -ForegroundColor Red
    $failures++
}

# Test 3: compress-discovery runs with empty input
Write-Host -NoNewline "  compress-discovery empty input... "
try {
    $out = echo "" | node $compress 2>&1
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    $failures++
}

# Test 4: parse-handoff runs with empty input
Write-Host -NoNewline "  parse-handoff empty input... "
try {
    $out = echo "" | node $handoff 2>&1
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    $failures++
}

Write-Host ""
if ($failures -eq 0) {
    Write-Host "All discovery/compression smoke tests passed." -ForegroundColor Green
} else {
    Write-Host "$failures test(s) failed." -ForegroundColor Red
    exit 1
}
