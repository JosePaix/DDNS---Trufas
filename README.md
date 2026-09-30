# Doces Do Nosso Sim - Versão Mobile com Conexão MySQL

Aplicativo mobile com layout otimizado, tema noturno (fundo preto e letras brancas), controle de vendas, estoque e relatórios.

## Conexão com Banco de Dados MySQL
O projeto agora inclui a configuração para conexão com o banco de dados utilizando a URL:
`${{ MySQL.MYSQL_PRIVATE_URL }}`

### Arquivos adicionados:
- `database.js`: Configuração contendo a URL privada do MySQL.
- `server.js`: Servidor Node.js integrado.
- `package.json`: Dependências (`express` e `mysql2`).
