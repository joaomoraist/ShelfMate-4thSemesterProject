@echo off
echo ==============================
echo  ShelfMate - Atualizar Repositorio (Pull)
echo ==============================

cd /d %~dp0

:: Verifica se é um repositório Git
if not exist ".git" (
    echo Este diretorio nao e um repositorio Git.
    pause
    exit /b
)

echo.
echo Atualizando do GitHub...
git fetch origin
git pull origin main

echo.
echo ==============================
echo  Atualizacao concluida!
echo ==============================
pause
