# Database – ShelfMate

Arquivos de schema e configurações para o banco Postgres/Supabase.

## Conteúdo
- `schema.sql` – definição de tabelas (ex.: `users`, `companies`, `products`, etc.).
- `source_data.txt` – parâmetros de conexão (host, user, password, dbname) e provedor (`cloud_supplier = supabase`).

## Conexão
- Exemplo (Supabase):
  - Host: `aws-1-us-east-2.pooler.supabase.com`
  - Porta: `5432`
  - Usuário: `postgres.<org>`
  - Senha: `...`
  - Database: `shelfmate_database`

> Recomenda-se usar DBeaver conforme tutorial em `docs/accounts_passwords.txt`.

## Provisionamento
- Crie o banco e aplique `schema.sql`.
- Configure `DATABASE_URL` no `backend/.env` (o módulo ML também tenta carregar esse arquivo).

## Segurança
- Evite expor credenciais em repositórios públicos.
- Rotacione senhas periodicamente.