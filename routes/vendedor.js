const bcrypt = require('bcrypt');
const db = require('./db'); // Certifique-se de que o caminho está correto

async function insertVendor() {
    const hashedPassword = await bcrypt.hash('vendedor123', 10);
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Vendedor', 'vendedor@gmail.com', vendedor123, 'vendor']);
    console.log('Vendedor inserido com sucesso');
}

insertVendor().catch(err => console.error('Erro ao inserir vendedor:', err));
