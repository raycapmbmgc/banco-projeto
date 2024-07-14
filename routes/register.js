const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const existingUser = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
          return res.send('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = {
          name: name,
          email: email,
          password: hashedPassword,
          role: 'client' 
      };
  
      // Insere o novo usuário na tabela 'users'
      await db.query('INSERT INTO users SET ?', user);
      res.redirect('/login');
    } catch (err) {
      console.error('Erro ao registrar usuário:', err);
      res.status(500).send('Erro ao registrar usuário');
    }
  });
  