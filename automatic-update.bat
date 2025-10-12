@echo off
echo ==============================
echo   ShelfMate - Sync Automático
echo ==============================

cd /d %~dp0

:: Mostra o usuário atual do PC
echo Usuário atual do PC: %USERNAME%
echo ==============================

:: Verifica se é um repositório Git
if not exist ".git" (
    echo Este diretório não é um repositório Git.
    pause
    exit /b
)

echo ==============================
echo   Adicionando novas alterações...
echo ==============================
git add -A

:: Conta quantos commits já existem no branch atual
for /f %%i in ('git rev-list --count HEAD') do set COMMIT_NUM=%%i

echo Criando commit automático...
git commit -m "Atualização automática - %USERNAME% Número: #%COMMIT_NUM%" >nul 2>&1

echo ==============================
echo   Limpando arquivos temporários...
echo ==============================
:: Remove apenas arquivos desnecessários, de forma segura
if exist node_modules (
    echo Removendo node_modules...
    rmdir /s /q node_modules
)
if exist *.log (
    echo Removendo arquivos .log...
    del /q /f *.log
)
if exist desktop.ini (
    del /q /f desktop.ini
)

echo ==============================
echo   Verificando integridade do repositório...
echo ==============================
git fsck --full
if %errorlevel% neq 0 (
    echo.
    echo !!!!! REPOSITÓRIO CORROMPIDO !!!!! 
    echo Limpe manualmente os objetos corrompidos ou recrie o .git
    pause
    exit /b
)

echo ==============================
echo   Puxando atualizações do servidor remoto (branch main)...
echo ==============================
git pull origin main --rebase
if %errorlevel% neq 0 (
    echo.
    echo !!!!! ERRO AO PUXAR (PULL) !!!!! 
    echo Pode haver um conflito de merge. Resolva-o manualmente.
    goto end
)

echo ==============================
echo   Enviando atualizações para o servidor remoto...
echo ==============================
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo !!!!! ERRO AO ENVIAR (PUSH) !!!!! 
    echo Verifique sua conexão ou se há conflitos.
    goto end
)

echo ==============================
echo   Sincronização concluída com SUCESSO!
echo ==============================

:end
echo.
echo Pressione qualquer tecla para sair...
pause
