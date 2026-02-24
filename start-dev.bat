@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════╗
echo ║     D&D Dice Platform Launcher       ║
echo ╚══════════════════════════════════════╝
echo.

:menu
echo Выберите режим запуска:
echo 1. Старт сервера (npm start)
echo 2. Режим разработки (npm run dev)
echo 3. Установка/обновление зависимостей
echo 4. Проверка версий
echo 5. Выход
echo.

set /p choice="Ваш выбор [1-5]: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto dev
if "%choice%"=="3" goto install
if "%choice%"=="4" goto version
if "%choice%"=="5" goto exit
echo Неверный выбор, попробуйте снова.
echo.
goto menu

:start
echo.
echo 🚀 Запуск сервера...
cd /d "%~dp0"
npm start
goto end

:dev
echo.
echo 🔧 Запуск в режиме разработки...
cd /d "%~dp0"
npm run dev
goto end

:install
echo.
echo 📦 Установка зависимостей...
cd /d "%~dp0"
npm install
echo.
echo Зависимости установлены!
echo.
goto menu

:version
echo.
echo 📊 Информация о версиях:
cd /d "%~dp0"
echo Node.js версия:
node --version
echo.
echo NPM версия:
npm --version
echo.
echo Пакеты проекта:
npm list --depth=0
echo.
pause
goto menu

:exit
echo.
echo До свидания! 🎲
timeout /t 2 > nul
exit

:end
pause