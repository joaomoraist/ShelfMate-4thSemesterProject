@echo off
echo ==============================
echo   ShelfMate - Sync Automático
echo ==============================

cd /d %~dp0

:: Verifica se é um repositório Git
if not exist ".git" (
    echo Este diretorio nao e um repositorio Git.
    pause
    exit /b
)

echo Adicionando todas as alteracoes...
git add -A

echo Criando commit...
:: O comando commit pode falhar se não houver nada para commitar, então não verificamos o erro aqui.
git commit -m "Atualizacao automatica" >nul 2>&1

echo Enviando atualizacoes para o servidor remoto...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo !!!!! ERRO AO ENVIAR (PUSH) !!!!!
    echo Verifique sua conexao com a internet ou se ha conflitos.
    goto end
)

echo Puxando atualizacoes do servidor remoto...
git pull origin main
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
echo Pressione qualquer tecla para sair...
pause >nul