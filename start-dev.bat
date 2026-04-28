@echo off
setlocal EnableExtensions

title NebulaOS - Start Dev
cd /d "%~dp0"

echo =========================================
echo   NebulaOS Dev Launcher
echo =========================================
echo.

set "HAS_ERROR=0"

where node >nul 2>&1
if errorlevel 1 (
	echo [ERROR] Node.js is not installed or not in PATH.
	set "HAS_ERROR=1"
)

where npm >nul 2>&1
if errorlevel 1 (
	echo [ERROR] npm is not installed or not in PATH.
	set "HAS_ERROR=1"
)

where go >nul 2>&1
if errorlevel 1 (
	echo [ERROR] Go is not installed or not in PATH.
	set "HAS_ERROR=1"
)

if "%HAS_ERROR%"=="1" (
	echo.
	echo Please install missing tools and run this script again.
	pause
	exit /b 1
)

set "UI_DEV_CMD=npm run dev"
where pnpm >nul 2>&1
if not errorlevel 1 (
	if exist nebula-ui\pnpm-lock.yaml set "UI_DEV_CMD=pnpm dev"
)

if not exist nebula-ui\node_modules (
	echo [WARN] UI dependencies might not be installed yet.
	echo Run install-dependence.bat first if startup fails.
	echo.
)

set "ROOT=%CD%"

echo Launching UI dev server...
start "NebulaOS UI (SolidStart)" cmd /k "cd /d "%ROOT%\nebula-ui" && %UI_DEV_CMD%"

echo Launching Kernel API server...
start "NebulaOS Kernel (Go Fiber)" cmd /k "cd /d "%ROOT%\nebula-kernel" && go run ./cmd/main.go"

echo.
echo Dev services launched in separate windows.
pause
exit /b 0
