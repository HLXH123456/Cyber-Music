@echo off
echo ============================================
echo   CYBER MUSIC - AI Music Player
echo ============================================
echo.

REM Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check yt-dlp
yt-dlp --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] yt-dlp is not installed!
    echo Please install yt-dlp: pip install yt-dlp
    echo.
)

REM Check ffmpeg
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] ffmpeg is not installed!
    echo Please install ffmpeg from https://ffmpeg.org/
    echo.
)

REM Install dependencies
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Kill any existing node process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    for /f "tokens=1" %%b in ('tasklist /FI "PID eq %%a" ^| findstr /I "node"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Starting server...
echo.
echo Open http://localhost:3000 in your browser
echo.
node server/index.js

pause
