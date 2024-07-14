const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

const upload = multer({ dest: 'public/images/' });
const Cart = require('../models/cart');
let cart = new Cart();

// Rota para exibir todos os produtos (cliente)
router.get('/client', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.render('client', { products });
    } catch (err) {
        res.status(500).send('Erro ao buscar produtos');
    }
});

// Rota para adicionar produto ao carrinho
router.post('/cart/add/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const quantity = parseInt(req.body.quantity);
    try {
        const [results] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        const product = results[0];

        if (product && product.stock >= quantity) {
            cart.addProduct(product, quantity);
            await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
            res.redirect('/products/client');
        } else {
            res.send('Quantidade solicitada não disponível em estoque.');
        }
    } catch (err) {
        res.status(500).send('Erro ao adicionar produto ao carrinho');
    }
});

// Remover produto do carrinho
router.post('/cart/remove/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const removedQuantity = cart.getQuantity(productId);
    cart.removeProduct(productId);

    try {
        await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [removedQuantity, productId]);
        res.redirect('/products/cart');
    } catch (err) {
        res.status(500).send('Erro ao remover produto do carrinho');
    }
});

// Rota para visualizar o carrinho
router.get('/cart', (req, res) => {
    res.render('cart', { cart });
});

// Rota para exibir a página de checkout
router.get('/checkout', (req, res) => {
    res.render('checkout', { cart });
});

// Rota para processar o pagamento
router.post('/checkout', (req, res) => {
    const { paymentMethod, cardNumber, cardName, cardExpiry, cardCVC } = req.body;

    if (paymentMethod === 'creditCard' || paymentMethod === 'debitCard') {
        if (cardNumber && cardName && cardExpiry && cardCVC) {
            console.log(`Processando pagamento com ${paymentMethod}:`);
            console.log(`Número do cartão: ${cardNumber}`);
            console.log(`Nome no cartão: ${cardName}`);
            console.log(`Validade: ${cardExpiry}`);
            console.log(`CVC: ${cardCVC}`);

            cart = new Cart();
            res.send('Pagamento processado com sucesso!');
        } else {
            res.send('Por favor, preencha todos os campos do cartão.');
        }
    } else {
        cart = new Cart();
        res.send('Pagamento processado com sucesso!');
    }
});

// Rota para exibir todos os produtos (admin)
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.render('admin', { products });
    } catch (err) {
        res.status(500).send('Erro ao buscar produtos');
    }
});

// Rota para exibir o formulário de adição de produto
router.get('/add', (req, res) => {
    res.render('edit', { product: null });
});

// Rota para adicionar um novo produto
router.post('/add', upload.single('image'), async (req, res) => {
    const { name, description, price, stock } = req.body;
    const imageUrl = req.file ? `/images/${req.file.filename}` : '';

    try {
        await db.query('INSERT INTO products (name, description, price, stock, imageUrl) VALUES (?, ?, ?, ?, ?)', [name, description, price, stock, imageUrl]);
        res.redirect('/products');
    } catch (err) {
        res.status(500).send('Erro ao adicionar produto');
    }
});

// Rota para exibir o formulário de edição de produto
router.get('/edit/:id', async (req, res) => {
    const productId = parseInt(req.params.id);

    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        const product = products[0];
        res.render('edit', { product });
    } catch (err) {
        res.status(500).send('Erro ao buscar produto');
    }
});

// Rota para atualizar um produto
router.post('/edit/:id', upload.single('image'), async (req, res) => {
    const productId = parseInt(req.params.id);
    const { name, description, price, stock } = req.body;
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    const product = products[0];
    const imageUrl = req.file ? `/images/${req.file.filename}` : product.imageUrl;

    try {
        await db.query('UPDATE products SET name = ?, description = ?, price = ?, stock = ?, imageUrl = ? WHERE id = ?', [name, description, price, stock, imageUrl, productId]);
        res.redirect('/products');
    } catch (err) {
        res.status(500).send('Erro ao atualizar produto');
    }
});

// Rota para deletar um produto
router.post('/delete/:id', async (req, res) => {
    const productId = parseInt(req.params.id);

    try {
        await db.query('DELETE FROM products WHERE id = ?', [productId]);
        res.redirect('/products');
    } catch (err) {
        res.status(500).send('Erro ao deletar produto');
    }
});

module.exports = router;
