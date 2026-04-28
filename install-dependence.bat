@echo off
setlocal EnableExtensions

title NebulaOS - Install Dependencies
cd /d "%~dp0"

echo =========================================
echo   NebulaOS Dependency Installer
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

echo [1/2] Installing UI dependencies...
pushd nebula-ui

where pnpm >nul 2>&1
if not errorlevel 1 (
	if exist pnpm-lock.yaml (
		echo Detected pnpm-lock.yaml. Using pnpm install.
		pnpm install
	) else (
		echo Using npm install.
		npm install
	)
) else (
	echo pnpm not found. Using npm install.
	npm install
)

if errorlevel 1 (
	popd
	echo [ERROR] UI dependency installation failed.
	pause
	exit /b 1
)
popd

echo.
echo [2/2] Downloading Go module dependencies...
pushd nebula-kernel
go mod download
if errorlevel 1 (
	popd
	echo [ERROR] Go dependency download failed.
	pause
	exit /b 1
)
popd

echo.
echo Dependencies installed successfully.
pause
exit /b 0
