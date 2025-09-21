@echo off
:: Script para atualizar repositório GitHub automaticamente
:: Nome do arquivo: update-git.bat

echo ================================
echo  🚀 Atualizando repositório Git
echo ================================
echo.

:: Perguntar mensagem de commit
set /p COMMIT_MSG=Digite a mensagem do commit: 

echo.
echo Adicionando arquivos modificados...
git add .

echo.
echo Criando commit: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

echo.
echo Enviando para o GitHub...
git push origin main

echo.
echo ✅ Repositório atualizado com sucesso!
pause
