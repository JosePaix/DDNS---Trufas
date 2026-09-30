// Configuração do Banco de Dados MySQL
// Conexão: ${{ MySQL.MYSQL_PRIVATE_URL }}

const dbConfig = {
    url: "${{ MySQL.MYSQL_PRIVATE_URL }}",
    dialect: "mysql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

module.exports = dbConfig;
