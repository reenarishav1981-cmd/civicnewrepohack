@echo off
title CivicPulse AI Intelligence Engine (Port 8001)
echo ===============================================================================
echo Starting CivicPulse Python AI Engine (FastAPI on Port 8001)...
echo ===============================================================================
cd /d "%~dp0\..\civic pulse zip final\civic pulse"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
