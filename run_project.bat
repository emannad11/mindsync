@echo off
echo Starting MindSync Project...

echo Seeding database users (if not already seeded)...
call .venv\Scripts\python backend\seed_user.py

echo Starting backend server in a new window...
start "MindSync Backend" cmd /k "call .venv\Scripts\activate && python backend\main.py"

echo Starting frontend server in a new window...
start "MindSync Frontend" cmd /k "npm run dev"

echo Both servers are starting up. Please check the new console windows.
pause
