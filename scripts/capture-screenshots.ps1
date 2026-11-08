# PowerShell script to capture screenshots
New-Item -ItemType Directory -Force -Path "docs/screenshots"

Write-Host "Starting Next.js server on port 3020..."
$server = Start-Process -FilePath "node" -ArgumentList "node_modules/next/dist/bin/next", "start", "-p", "3020" -PassThru -WindowStyle Hidden -RedirectStandardOutput "server.log" -RedirectStandardError "server_err.log"

$urlReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3020" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            $urlReady = $true
            break
        }
    } catch {}
}

if (-not $urlReady) {
    Write-Host "Error: Server failed to start on port 3020."
    if (Test-Path "server.log") { Get-Content "server.log" }
    if (Test-Path "server_err.log") { Get-Content "server_err.log" }
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Server is ready on http://localhost:3020"

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$shareHash = "eyJxX3Njb3BlIjoiaW5fc2NvcGUiLCJxX2RlcG9zaXQiOjMsInFfYWR2YW5jZV9yZW50IjoyLCJxX2NvbWJpbmVkX2RlcG9zaXRfYWR2YW5jZSI6Im92ZXJfMyIsInFfZWxlY3RyaWNpdHlfcmF0ZSI6ImZsYXRfZml4ZWRfaGlnaCIsInFfd2F0ZXJfcmF0ZSI6ImZsYXRfZml4ZWRfaGlnaCIsInFfZGVwb3NpdF9yZWZ1bmRfcGVyaW9kIjoib3Zlcl83X2RheXMiLCJxX2RlcG9zaXRfZm9yZmVpdHVyZSI6Imhhc19hdXRvbWF0aWNfZm9yZmVpdCIsInFfdGVuYW50X3Rlcm1pbmF0aW9uIjoic3RyaWN0bHlfcHJvaGliaXRlZCIsInFfbGVzc29yX3Rlcm1pbmF0aW9uX25vdGljZSI6ImltbWVkaWF0ZV90ZXJtaW5hdGlvbiIsInFfaW5zcGVjdGlvbl93aXRob3V0X25vdGljZSI6InVuYW5ub3VuY2VkX2VudHJ5IiwicV9sb2Nrb3V0X2FuZF9zZWl6dXJlIjoiaGFzX2xvY2tvdXRfY2xhdXNlIn0"

# 1. Desktop Home
Write-Host "Capturing desktop-home.png..."
& $chrome --headless=new --screenshot="docs/screenshots/desktop-home.png" --window-size=1280,900 --virtual-time-budget=2000 "http://localhost:3020"

# 2. Mobile Home (375px)
Write-Host "Capturing mobile-home-375px.png..."
& $chrome --headless=new --screenshot="docs/screenshots/mobile-home-375px.png" --window-size=375,812 --virtual-time-budget=2000 "http://localhost:3020"

# 3. Desktop Check Form
Write-Host "Capturing desktop-check-rental.png..."
& $chrome --headless=new --screenshot="docs/screenshots/desktop-check-rental.png" --window-size=1280,900 --virtual-time-budget=2000 "http://localhost:3020/check/rental"

# 4. Mobile Check Form (375px)
Write-Host "Capturing mobile-check-rental-375px.png..."
& $chrome --headless=new --screenshot="docs/screenshots/mobile-check-rental-375px.png" --window-size=375,812 --virtual-time-budget=2000 "http://localhost:3020/check/rental"

# 5. Desktop Result Screen
Write-Host "Capturing desktop-result-screen.png..."
& $chrome --headless=new --screenshot="docs/screenshots/desktop-result-screen.png" --window-size=1280,1000 --virtual-time-budget=2500 "http://localhost:3020/check/rental#share=$shareHash"

# 6. Mobile Result Screen (375px)
Write-Host "Capturing mobile-result-screen-375px.png..."
& $chrome --headless=new --screenshot="docs/screenshots/mobile-result-screen-375px.png" --window-size=375,812 --virtual-time-budget=2500 "http://localhost:3020/check/rental#share=$shareHash"

Write-Host "Stopping Next.js server..."
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue

Write-Host "All screenshots captured successfully!"
