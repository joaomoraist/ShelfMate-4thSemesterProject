// Arquivo de exemplo de configuração
// Copie este arquivo para .env na raiz do projeto

export const config = {
  // Configurações do Banco de Dados
  DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/nome_do_banco',
  
  // Configurações do Servidor
  PORT: 3000
};

// Exemplo de uso:
// 1. Crie um arquivo .env na raiz do projeto
// 2. Adicione: DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
// 3. Adicione: PORT=3000
// 4. Nunca commite o arquivo .env no git
