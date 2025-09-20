@echo off
set PROJECT=ShelfMate

:: Criar pasta raiz
mkdir %PROJECT%
cd %PROJECT%

:: Backend
mkdir backend\src\controllers backend\src\models backend\src\routes backend\src\services backend\src\utils
echo. > backend\src\index.ts
echo. > backend\package.json
echo. > backend\tsconfig.json
echo. > backend\README.md

:: Frontend
mkdir frontend\src\components frontend\src\pages frontend\src\hooks frontend\src\services frontend\src\styles frontend\public
echo. > frontend\src\main.tsx
echo. > frontend\package.json
echo. > frontend\tsconfig.json
echo. > frontend\README.md

:: Docs
mkdir docs
echo. > docs\arquitetura.md
echo. > docs\checklist.md
echo. > docs\fluxo-usuarios.png

:: Database
mkdir database\migrations
echo. > database\schema.sql
echo. > database\seeds.sql

:: Arquivos raiz
echo. > .gitignore
echo. > README.md
echo. > LICENSE

echo Estrutura do projeto %PROJECT% criada com sucesso 🚀
pause
