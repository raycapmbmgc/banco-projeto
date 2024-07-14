const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const engine = require('ejs-mate');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const port = 3000;

// Configurações do Express
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
  secret: 'sua-chave-secreta-aqui',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rota principal
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Rota para processar o login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
      // Busca usuário no banco de dados pelo email
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];

      // Verifica se usuário e senha estão corretos
      if (user && await bcrypt.compare(password, user.password)) {
          // Define sessão de login
          req.session.logged_in = true;
          req.session.user = user;

          // Redireciona com base no papel do usuário
          if (user.role === 'vendor') {
              res.send('Vendor login successful');
          } else {
              res.send('Client login successful');
          }
      } else {
          res.status(401).send('Invalid email or password');
      }
  } catch (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      res.status(500).send('Erro ao conectar ao banco de dados');
  }
});



app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
      // Verifica se o email já está registrado
      const existingUser = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
          return res.send('Email already registered');
      }

      // Hash a senha antes de armazenar
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
          name: name,
          email: email,
          password: hashedPassword,
          role: 'client'  // Assume 'client' role by default
      };

      await db.query('INSERT INTO users SET ?', newUser);
      res.redirect('/login');
  } catch (err) {
      console.error('Erro ao registrar usuário:', err);
      res.status(500).send('Erro ao registrar usuário');
  }
});

// Middleware de autenticação para rotas protegidas
function requireLogin(req, res, next) {
  if (req.session.logged_in) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Rota de perfil
app.get('/profile', requireLogin, (req, res) => {
  res.render('profile', {
    error: null,
    userEmail: req.session.user.email
  });
});

// Rota de produtos para clientes
app.get('/products/client', requireLogin, async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products');
    res.render('client', { products });
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).send('Erro ao buscar produtos');
  }
});

// Rota de produtos para admin (vendedor)
app.get('/products', requireLogin, async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products');
    res.render('admin', { products });
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).send('Erro ao buscar produtos');
  }
});

// Rota para adicionar um novo produto
app.get('/products/add', requireLogin, (req, res) => {
  res.render('edit', { product: null });
});

app.post('/products/add', requireLogin, async (req, res) => {
  const { name, quantity, price } = req.body;
  try {
    await db.query('INSERT INTO products (name, quantity, price) VALUES (?, ?, ?)', [name, quantity, price]);
    res.redirect('/products');
  } catch (err) {
    console.error('Erro ao adicionar produto:', err);
    res.status(500).send('Erro ao adicionar produto');
  }
});

// Rota para editar um produto
app.get('/products/edit/:id', requireLogin, async (req, res) => {
  const productId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    const product = rows[0];
    res.render('edit', { product });
  } catch (err) {
    console.error('Erro ao buscar produto para edição:', err);
    res.status(500).send('Erro ao buscar produto para edição');
  }
});

app.post('/products/edit/:id', requireLogin, async (req, res) => {
  const productId = req.params.id;
  const { name, quantity, price } = req.body;
  try {
    await db.query('UPDATE products SET name = ?, quantity = ?, price = ? WHERE id = ?', [name, quantity, price, productId]);
    res.redirect('/products');
  } catch (err) {
    console.error('Erro ao editar produto:', err);
    res.status(500).send('Erro ao editar produto');
  }
});

// Rota para deletar um produto
app.post('/products/delete/:id', requireLogin, async (req, res) => {
  const productId = req.params.id;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [productId]);
    res.redirect('/products');
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).send('Erro ao deletar produto');
  }
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/profile');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

module.exports = app;
