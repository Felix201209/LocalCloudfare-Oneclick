@echo off
setlocal
set APP_HOME=%ProgramFiles%\LocalCloudflare
cd /d "%APP_HOME%"
node dist\index.js start
endlocal
