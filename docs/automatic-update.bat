@echo off
setlocal enabledelayedexpansion

echo ============================================
echo        ShelfMate - Sync Automático
echo ============================================
echo.

:: Detecta o diretório raiz do projeto (onde o script está)
cd /d "%~dp0"
if not exist ".git" (
    if exist "..\.git" (
        cd ..
    ) else (
        echo ❌ Este diretório não é um repositório Git.
        pause
        exit /b
    )
)

:: Testa se o Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ O Git não está instalado ou não está no PATH.
    echo Instale o Git e tente novamente: https://git-scm.com/downloads
    pause
    exit /b
)

:: Exibe o usuário do sistema e branch atual
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%b
echo Usuário atual: %USERNAME%
echo Branch atual: %CURRENT_BRANCH%
echo ============================================

:: Adiciona todas as alterações
echo Adicionando alterações...
git add -A

:: Conta commits existentes
for /f %%i in ('git rev-list --count HEAD') do set COMMIT_NUM=%%i

:: Pergunta mensagem do commit
set /p COMMIT_MSG=Digite a mensagem do commit (ou deixe vazio para padrão): 
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Atualização automática por %USERNAME% - Commit #%COMMIT_NUM%
)

echo Criando commit: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Nenhuma alteração detectada para commit.
) else (
    echo ✅ Commit criado com sucesso!
)

echo ============================================
echo Puxando atualizações do branch remoto (%CURRENT_BRANCH%)...
echo ============================================
git pull origin %CURRENT_BRANCH% --rebase
if %errorlevel% neq 0 (
    echo ❌ Erro ao puxar alterações. Pode haver conflito de merge.
    echo Resolva os conflitos e rode novamente este script.
    goto end
)

echo ============================================
echo Enviando atualizações para o remoto...
echo ============================================
git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo ❌ Falha ao enviar alterações. Verifique sua conexão ou permissões.
    goto end
)

echo ============================================
echo ✅ Sincronização concluída com sucesso!
echo ============================================

:end
echo.
echo Pressione qualquer tecla para sair...
pause
exit /b
