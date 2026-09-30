// Servidor Node.js com Conexão MySQL configurada
// URL do Banco: ${{ MySQL.MYSQL_PRIVATE_URL }}

const express = require('express');
const path = require('path');
const dbConfig = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

app.get('/api/db-status', (req, res) => {
    res.json({
        status: "Configurado",
        connectionString: dbConfig.url
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Conexão MySQL configurada: ${dbConfig.url}`);
});
