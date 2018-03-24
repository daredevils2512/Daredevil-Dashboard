@echo off
cd web
title Dashboard Web Server
:Bean
python -m http.server 80
pause
cls
echo Restarting...
goto Bean