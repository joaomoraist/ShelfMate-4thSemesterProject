@echo off
:: Script para atualizar repositório GitHub automaticamente
:: Nome do arquivo: update-git.bat

echo ================================
echo  Atualizando repositório GitHub
echo ================================
echo.

:: Perguntar mensagem de commit
set /p COMMIT_MSG=Digite a mensagem do commit: 

echo.
echo Adicionando todos os arquivos modificados, novos e deletados...
git add -A

echo.
:: Verifica se há algo para commitar
git diff --cached --quiet
if %errorlevel%==0 (
    echo Nenhuma alteração para commitar.
) else (
    echo Criando commit: "%COMMIT_MSG%"
    git commit -m "%COMMIT_MSG%"
)

echo.
echo Enviando para o GitHub...
git push origin main

echo.
echo Repositório atualizado com sucesso!
pause
