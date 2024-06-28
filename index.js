const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const password = process.env.PASSWORD;

const productsFile = 'products.json';

const token = jwt.sign({ user: 'admin' }, password);
console.log("jeton JWT : ", token);

function readProducts() {
  try {
    const data = fs.readFileSync(productsFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return []; 
  }
}

function writeProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf-8');
}

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  jwt.verify(token, password, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Jeton invalide' });
    }
    req.user = user;
    next();
  });
}

app.use(express.json());

app.get('/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Produit non trouvé' });
  }
});

app.post('/products', authenticate, (req, res) => {
  const newProduct = req.body;

  newProduct.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const products = readProducts();
  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

app.put('/products/:id', authenticate, (req, res) => {
  const products = readProducts();
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex !== -1) {
    products[productIndex] = req.body;
    writeProducts(products);
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Produit non trouvé' });
  }
});

app.delete('/products/:id', authenticate, (req, res) => {
  const products = readProducts();
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex !== -1) {
    const deletedProduct = products.splice(productIndex, 1)[0];
    writeProducts(products);
    res.json(deletedProduct);
  } else {
    res.status(404).json({ message: 'Produit non trouvé' });
  }
});

module.exports = index;
