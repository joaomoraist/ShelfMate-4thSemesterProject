@echo off
echo ==============================
echo   ShelfMate - Sync Automático
echo ==============================

cd /d %~dp0

:: Verifica se é um repositório Git
if not exist ".git" (
    echo Este diretorio nao e um repositorio Git.
    exit /b
)

:: Adiciona todas as alterações
git add -A

:: Commit com mensagem padrao
git commit -m "Atualização automatica" >nul 2>&1

:: Envia para o GitHub
git push origin main

:: Puxa atualizações do GitHub
git fetch origin
git pull origin main

echo ==============================
echo   Sincronizacao concluida!
echo ==============================
