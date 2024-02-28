const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const base = 'http://localhost:3000'

app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.locals.user = null;
app.locals.loginerror = false;
app.locals.registererror = false;
app.locals.editprofileerror = false;
app.locals.cartlength = 0;
// frontend route

app.get('/', async (req, res) => {
    try {
        if (app.locals.user !== null) {
            const response = await axios.get(base + '/user/getUser/:id');
            res.render("index", { bread: response.data });
        } else {
        res.render("index");
        }
    } catch (err) {
        console.log(err);
        res.render("index", { error: 'Error during homepage' });
    }
});

app.get('/menu', async (req, res) => {
    try {
        const response = await axios.get(base + '/bread/all');
        res.render("menu", { bread: response.data });
    } catch (err) {
        console.log(err);
        res.render("menu", { error: 'Error during menupage' });
    }
});

app.get('/login', async (req, res) => {
    try {
        res.render("login");
    } catch (err) {
        const loginError = true;
        console.log(err);
        res.render("login", { error: 'Error during homepage' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const response = await axios.post(base + '/user/login', req.body);
        res.render("index", { user: response.data });
    } catch (err) {
        console.log(err);
    
        if (err.name === 'SequelizeValidationError') {
            const errors = err.errors.map(error => error.message);
            return res.status(400).json({ errors });
        } else {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.redirect('/login');
    }
    
});

app.get('/register', (req, res) => {
    try {
        res.render("register");
    } catch (err) {
        console.log(err);
        res.render("register", { error: 'Error during registration' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const response = await axios.post(base + '/user/register', req.body);
        res.render("login", { user: response.data });
    } catch (err) {
        console.log(err);
    
        if (err.name === 'SequelizeValidationError') {
            const errors = err.errors.map(error => error.message);
            return res.status(400).json({ errors });
        } else {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.redirect('/register');
    }
    
});


app.listen(5500, () => {
    console.log('Server running on port http://localhost:5500/');
});