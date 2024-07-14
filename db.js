const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Substitua pela senha do seu banco de dados MySQL
    database: 'projeto1'
});

const promisePool = pool.promise();

const createUsersTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'client',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        await promisePool.query(createTableQuery);
        console.log('Tabela users criada com sucesso ou já existe.');
    } catch (err) {
        console.error('Erro ao criar tabela users:', err);
    }
};

const insertVendorUser = async () => {
    const vendorEmail = 'vendor@example.com';
    const vendorPassword = 'vendor123';
    const hashedPassword = await bcrypt.hash(vendorPassword, 10);

    const insertVendorQuery = `
        INSERT INTO users (name, email, password, role) 
        VALUES ('Vendedor', ?, ?, 'vendor')
        ON DUPLICATE KEY UPDATE email=email
    `;

    try {
        await promisePool.query(insertVendorQuery, [vendorEmail, hashedPassword]);
        console.log('Usuário vendedor inserido com sucesso.');
    } catch (err) {
        console.error('Erro ao inserir usuário vendedor:', err);
    }
};

const initializeDatabase = async () => {
    await createUsersTable();
    await insertVendorUser();
};

initializeDatabase();

module.exports = promisePool;
