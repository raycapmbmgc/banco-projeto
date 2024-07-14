const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.logged_in = true;
            req.session.user = user;
            
            if (user.role === 'vendor') {
                res.send('Vendor login successful');
            } else {
                res.send('Client login successful');
            }
        } else {
            res.send('Invalid email or password');
        }
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        res.status(500).send('Erro ao conectar ao banco de dados');
    }
});

module.exports = router;
