// =========================
// TechStore 3.0 AVANÇADO (com bugs sutis + carrinho)
// =========================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./techstore.db');

// =========================
// BANCO
// =========================

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    stock INTEGER
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL
  )`);

    db.run("INSERT OR IGNORE INTO products VALUES (1,'Notebook',3000,5)");
    db.run("INSERT OR IGNORE INTO products VALUES (2,'Mouse',100,10)");
});

// =========================
// ROTAS
// =========================

app.post('/register', (req, res) => {
    const { email, password } = req.body;

    // BUG: não valida nada
    db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, password], function (err) {
        if (err) return res.status(400).send("Erro genérico");
        res.send("OK");
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email=? AND password=?", [email, password], (err, row) => {

        // BUG: retorna sucesso mesmo sem usuário
        if (!row) return res.send({ fake: true });

        res.send(row);
    });
});

app.get('/products', (req, res) => {

    // BUG: lentidão simulada
    setTimeout(() => {
        db.all("SELECT * FROM products", [], (err, rows) => {
            res.send(rows);
        });
    }, 1500);
});

app.post('/order', (req, res) => {
    const { user_id, total } = req.body;

    // BUG: aceita qualquer total
    db.run("INSERT INTO orders (user_id, total) VALUES (?, ?)", [user_id, total], function (err) {
        res.send({ order_id: this.lastID });
    });
});

app.get('/orders/:user_id', (req, res) => {
    db.all("SELECT * FROM orders WHERE user_id=?", [req.params.user_id], (err, rows) => {
        res.send(rows);
    });
});

// =========================
// FRONTEND AVANÇADO
// =========================

app.get('/', (req, res) => {
    res.send(`
  <html>
  <head>
    <title>TechStore 3.0</title>
    <style>
      body { font-family: Arial; background:#eef2f7; margin:0 }
      header { background:#1e293b; color:white; padding:15px; text-align:center }
      .container { padding:20px }
      .card { background:white; padding:15px; margin-bottom:15px; border-radius:10px }
      button { padding:6px 10px; background:#3b82f6; color:white; border:none; border-radius:5px }
      input { width:100%; margin:5px 0; padding:6px }
    </style>
  </head>

  <body>
  <header><h1>🛒 TechStore 3.0</h1></header>

  <div class="container">

    <div class="card">
      <h3>Cadastro</h3>
      <input id="email" placeholder="Email">
      <input id="password" placeholder="Senha">
      <button onclick="register()">Cadastrar</button>
    </div>

    <div class="card">
      <h3>Login</h3>
      <input id="loginEmail">
      <input id="loginPass">
      <button onclick="login()">Login</button>
    </div>

    <div class="card">
      <h3>Produtos</h3>
      <button onclick="loadProducts()">Carregar</button>
      <ul id="products"></ul>
    </div>

    <div class="card">
      <h3>Carrinho</h3>
      <ul id="cart"></ul>
      <p>Total: <span id="total">0</span></p>
      <button onclick="checkout()">Finalizar</button>
    </div>

  </div>

<script>
let user = null;
let cart = [];

function register(){
  fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email:email.value,password:password.value})})
  .then(r=>r.text()).then(alert);
}

function login(){
  fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({email:loginEmail.value,password:loginPass.value})})
  .then(r=>r.json())
  .then(d=>{user=d; alert('logado');});
}

function loadProducts(){
  products.innerHTML='Carregando...';

  fetch('/products')
  .then(r=>r.json())
  .then(data=>{
    products.innerHTML='';
    data.forEach(p=>{
      products.innerHTML += '<li>'+p.name+' - '+p.price+
      ' <button onclick="add('+p.price+')">Add</button></li>';
    });
  });
}

function add(price){
  cart.push(price);
  renderCart();
}

function renderCart(){
  cart.innerHTML='';
  let total=0;

  cart.forEach(v=>{
    document.getElementById('cart').innerHTML += '<li>'+v+'</li>';

    // BUG: erro só com múltiplos itens
    total += v;
  });

  if(cart.length>1){ total = total - 10 } // BUG escondido

  document.getElementById('total').innerText = total;
}

function checkout(){
  fetch('/order',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({user_id:user?.id,total:document.getElementById('total').innerText})
  })
  .then(r=>r.json())
  .then(d=>alert('Pedido '+d.order_id));

  // BUG: carrinho não limpa sempre
  if(Math.random()>0.5){ cart=[] }
}
</script>

  </body>
  </html>
  `);
});

app.listen(3000, () => console.log('http://localhost:3000'));