@echo off
setlocal

REM Root of the project (this .bat file's directory)
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%aacma_backend"

echo.
echo Starting AACMA Django backend (Django)...
start "AACMA Backend" cmd /k ^
 "cd /d \"%BACKEND_DIR%\" && ^
  python --version || (echo [ERROR] Python is not available on PATH. & pause & exit /b 1) && ^
  echo Running Django checks... && ^
  python manage.py check || (echo. & echo [ERROR] Django check failed. You likely need to install Python deps first: pip install -r requirements.txt & pause) && ^
  echo Starting server at http://localhost:8000 ... && ^
  python manage.py runserver"

echo.
echo Starting Next.js frontend (npm)...
start "AACMA Frontend" cmd /k ^
 "cd /d \"%ROOT%\" && ^
  node --version || (echo [ERROR] Node.js is not available on PATH. & pause & exit /b 1) && ^
  npm --version || (echo [ERROR] npm is not available on PATH. & pause & exit /b 1) && ^
  REM Override common offline/cache-only settings (your machine currently appears to be in offline mode) && ^
  set \"NPM_CONFIG_OFFLINE=false\" && ^
  set \"NPM_CONFIG_PREFER_OFFLINE=false\" && ^
  set \"NPM_CONFIG_PREFER_ONLINE=true\" && ^
  set \"NPM_CONFIG_CACHE_MODE=\" && ^
  if not exist \"node_modules\" ( ^
    echo node_modules not found - running npm install... && ^
    npm install || (echo. & echo [ERROR] npm install failed (likely offline/cache-only or network blocked). Fix npm network access, then re-run. & pause) ^
  ) && ^
  echo Starting dev server at http://localhost:3000 ... && ^
  npm run dev"

echo.
echo Both backend (http://localhost:8000) and frontend (http://localhost:3000) are starting in separate windows.
endlocal
exit /b 0

