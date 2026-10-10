@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js。请先安装 Node.js 22.12 或以上版本。
  pause
  exit /b 1
)
node scripts\launch.mjs %*
if errorlevel 1 pause
endlocal
