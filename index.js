const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const { error } = require('console');
const { copyFileSync } = require('fs');
const e = require('express');
const { render } = require('ejs');
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
app.locals.cart = null;

axios.get(`${base}/bread/all`)
  .then(response => {
    app.locals.bread = response.data;
  }).catch (error => {
    console.log(error);
});

// default route
app.get('/', async (req, res) => {
    res.render('login.ejs', { data: app.locals.user });
});

// route to register page
app.get('/register', (req, res) => {
    res.render('register.ejs');
    app.locals.registererror = false;
});

// route to register by post method
app.post('/register', async (req, res) => {
    axios.post(`${base}/user/register`, req.body)
    .then((response) => {
        if (response.data.registerfailed == true) {
            app.locals.registererror = true;
            res.redirect('/register');
        } else {
            res.redirect('/login');
        }
    }).catch((error) => {
        console.log(error);
    });
});

// route to login page
app.get('/login', (req, res) => {
    res.render('login.ejs');
    app.locals.loginerror = false;
});

// route to login by post method
app.post('/login', async (req, res) => {
    axios.post(`${base}/user/login`, req.body)
        .then((response) => {
            if (response.data.statuslogin == true) {
                app.locals.user = response.data;
                res.render('index.ejs', {data: app.locals.user});
            } else {
                app.locals.loginerror = true;
                res.redirect('/login');
            }
        })
        .catch(error => {
            res.send(error);
            res.redirect('/login');
        })
});

// route to logout
app.get('/logout', (req, res) => {
    app.locals.user = null;
    res.redirect('/');
});

// route to go to profile page
app.get('/profile', (req, res) => {
    if (app.locals.user == null) {
        res.redirect('/login');
    } else {
        res.render('profile.ejs', {data: app.locals.user});
    }
});

// route to go to edit profile page
app.get('/editprofile', (req, res) => {
    if (app.locals.user == null) {
        res.redirect('/login');
    } else {
        res.render('editprofile.ejs', {data: app.locals.user});
        app.locals.editprofileerror = false;
    }
});

// route to update profile by post method
app.post('/editprofile', async (req, res) => {
    axios.post(`${base}/user/update/${app.locals.user.data.userId}`, req.body)
    .then((response) => {
        if (response.data.updatefailed == true) {
            app.locals.editprofileerror = true;
            res.redirect('/editprofile');
        } else {
            app.locals.user = {statuslogin: true, data: response.data};
            res.redirect('/profile');
        }
    })
    .catch((err) => {
        res.redirect('/editprofile');
    });
});

// route to get user data by user id
app.get('/user/:id', (req, res) => {
});

// route to delete profile or user
app.get('/deleteprofile', (req, res) => {
    axios.get(`${base}/user/delete/${app.locals.user.data.userId}`)
    .then((response) => {
        app.locals.user = null;
        res.redirect('/login');
    }).catch ((err) => {
        res.redirect('/profile');
    });
});

// route to get add product page
app.get('/addproduct', (req, res) => {
    if (app.locals.user != null) {
        res.render('addbread.ejs');
    } else { res.redirect('/login'); }
});

// route to add product by post method
app.post('/addproduct', async (req, res) => {
    axios.post(`${base}/bread/new`, req.body)
        .then((response) => {
            axios.get(`${base}/bread/all`)
            .then((response) => {
                app.locals.bread = response.data;
                res.render('manageproducts.ejs', {bread: app.locals.bread});
            }).catch(err => {
                res.redirect('/');
            });
        }).catch(error => {
            res.redirect('/addbread');
        });
});

// route to manage products pages
app.get('/manageproducts', async (req, res) => {
    try {
        res.render('manageproducts.ejs', {bread: app.locals.bread});
    } catch (err) {
        res.redirect('/');
    }
});

// route to get all bread data
app.get('/bread', (req, res) => {
    axios.get(`${base}/bread/all`)
    .then((response) => {
        app.locals.bread = response.data;
        res.render('bread.ejs', {bread: response.data});
    }).catch(error => {
        res.redirect('/');
    });
});

// route to get bread data by category
app.get('/bread/:category', (req, res) => {
    axios.get(`${base}/bread/category/${req.params.category}`)
  .then((response) => {
    res.render('bread.ejs', {bread: response.data});
  }).catch((error) => {
    res.redirect('/');
  });
});

// route to get bread data by bread id
app.get('/editbread/:id',  (req, res) => {
    axios.get(`${base}/bread/get/${req.params.id}`)
    .then(response => {
        res.render('editbread.ejs', {bread: response.data});
    }).catch(err => {
        res.json(err);
    })
});

// route to update bread by post method
app.post('/editbread/:id', async (req, res) => {
    axios.post(`${base}/bread/update/${req.params.id}`, req.body)
    .then((response) => {
        axios.get(`${base}/bread/all`)
      .then((response) => {
        app.locals.bread = response.data;
        res.render('manageproducts.ejs', {bread: app.locals.bread});
      }).catch((error) => {
        res.redirect('/');
      });
    }).catch((error) => {
        res.redirect('/');
    });
});

// route to delete bread
app.get('/deletebread/:id', (req, res) => {
    axios.delete(`${base}/bread/delete/${req.params.id}`)
    .then((response) => {
        axios.get(`${base}/bread/all`)
        .then((response) => {
            app.locals.bread = response.data;
            res.render('manageproducts.ejs', {bread: app.locals.bread});
        }).catch((error) => {
            res.redirect('/');
        });
    }).catch((error) => {
    res.redirect('/manageproducts');
    });
});

// route to get menu pages
app.get('/menu', (req, res) => {
    if(app.locals.user == null) {
        res.redirect('/login');
      } else { res.render('menu.ejs', {menu: app.locals.bread}); }
});

// route to get menu by bread id
app.get('/menu/:id', (req, res) => {
    axios.get(`${base}/bread/get/${req.params.id}`)
  .then(response => {
    res.render('menu.ejs', {bread: response.data});
  }).catch((error) => {
    res.redirect('/');
  });
});

// route to get about page
app.get('/about', (req, res) => {
    res.render('about.ejs');
})

// route to get user cart
app.get('/cart', (req, res) => {
    if (app.locals.user == null) {
        res.redirect('/login'); 
    } else {
        axios.get(`${base}/cart/getDetail/${app.locals.user.data.userId}`)
        .then(response => {
            app.locals.cart = response.data;
            res.render('cart.ejs', {cart: app.locals.cart});
        }).catch((error) => {
            console.error(error);
            res.redirect('/');
        });
    }
    }
);

// route to add to cart
app.post('/addtocart', (req, res) => {
    if(app.locals.user == null) {
      res.redirect('/login');
    } else {
        axios.post(`${base}/cart/add/${req.body.breadId}`, req.body)
        .then(response => {
            axios.get(`${base}/cart/getDetail/${req.body.userId}`) 
            .then(response => {
                app.locals.cart = response.data;
              res.render('menu.ejs' , {cart: app.locals.cart});
            })
            .catch(error => {
                res.send(error)
              res.redirect('/');
            });
        })
        .catch(error => {
            res.send(error)
            res.redirect('/');
        });
    }
});

// route to make order
app.post('/checkout', (req, res) => {
    axios.post(`${base}/makeOrder/${req.body.userId}`, req.body)
    .then(response => {
        app.locals.cart = response.data;
        res.redirect('/menu');
    })
    .catch(error => {
        res.send(error)
        res.redirect('/');
    });
});

// route to get all orders received
app.get('/order', (req, res) => {
    axios.get(`${base}/order/received`).
    then(response => {
        // axios.get(`${base}/user/getUser/${app.locals.user.data.userId}`)
        // .then((response) => { 
        //     // response.data.forEach((user) => {
        //     //     app.locals.arrayUser = user;
        //     //     console.log(user);
        //     // });
        //     // app.locals.user = response.data;
        //     // res.render('order.ejs', {data: app.locals.user});
        // })
        // .catch((err) => { res.json(err); });    
        app.locals.order = response.data;
        res.render('order.ejs', {order: app.locals.order});
    }).catch(error => {
        res.redirect('/');
    });
});



app.post
  app.listen(5000, () => {
    console.log('Server is running at http://localhost:5000/');
});