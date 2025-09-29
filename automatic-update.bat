@echo off
echo ==============================
echo   ShelfMate - Sync Automatico
echo ==============================

cd /d %~dp0

:: Mostra o usuário atual do PC
echo Usuario atual do PC: %USERNAME%
echo ==============================

:: Verifica se é um repositório Git
if not exist ".git" (
    echo Este diretorio nao e um repositorio Git.
    pause
    exit /b
)

echo ==============================
echo   Limpeza de arquivos temporarios e node_modules...
echo ==============================
:: Remove arquivos não rastreados e diretórios (node_modules, logs, etc.)
git clean -fd

:: Remove objetos corrompidos conhecidos (desktop.ini)
if exist ".git\refs\desktop.ini" del ".git\refs\desktop.ini"
if exist ".git\objects\desktop.ini" del ".git\objects\desktop.ini"

echo ==============================
echo   Verificando integridade do repositório...
echo ==============================
git fsck --full
if %errorlevel% neq 0 (
    echo.
    echo !!!!! REPOSITORIO CORROMPIDO !!!!! 
    echo Limpe manualmente os objetos corrompidos ou recrie o .git
    pause
    exit /b
)

echo ==============================
echo   Adicionando todas as alteracoes...
echo ==============================
git add -A

:: Conta quantos commits já existem no branch atual
for /f %%i in ('git rev-list --count HEAD') do set COMMIT_NUM=%%i

echo Criando commit automatico...
git commit -m "Atualizacao automatica - %USERNAME% Numero: #%COMMIT_NUM%" >nul 2>&1

echo ==============================
echo   Enviando atualizacoes para o servidor remoto (branch main)...
echo ==============================
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo !!!!! ERRO AO ENVIAR (PUSH) !!!!! 
    echo Verifique sua conexao com a internet ou se ha conflitos.
    goto end
)

echo ==============================
echo   Puxando atualizacoes do servidor remoto (branch main)...
echo ==============================
git pull origin main --rebase
if %errorlevel% neq 0 (
    echo.
    echo !!!!! ERRO AO PUXAR (PULL) !!!!! 
    echo Pode haver um conflito de merge. Resolva-o manualmente.
    goto end
)

echo ==============================
echo   Sincronizacao concluida com SUCESSO!
echo ==============================

:end
echo.
echo Pressione qualquer tecla para sair...
pause
