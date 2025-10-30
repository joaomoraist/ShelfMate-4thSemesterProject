# Docs – ShelfMate

Materiais auxiliares, scripts e referências para o desenvolvimento e manutenção do projeto.

## Conteúdo
- `accounts_passwords.txt` – referências de acesso (evite publicar credenciais).
- `automatic-update.bat` – script para sincronização automática com Git (add/commit/push).
- `setup-project.bat` – gera estrutura básica de projeto (pastas e arquivos).
- `tutorial.bat` – roteiro de comandos comuns.
- `goals.bat` – metas e checklist (exemplo).
- `update-git.bat` – fluxo simplificado de commit/push.
- `update_repo.bat` – atualiza do GitHub (fetch/pull).

## Boas Práticas
- Não versionar `.env` ou credenciais sensíveis.
- Validar scripts antes de execução em ambiente de CI/CD.
- Preferir variáveis de ambiente e serviços gerenciados (Render, Supabase, AWS).