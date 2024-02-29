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
app.locals.loginError = false;
app.locals.loginErrorMessage = "";
app.locals.updateError = false;
app.locals.updateErrorMessage = "";
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
    res.render('index.ejs');
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
        } else { res.redirect('/login'); }
    }).catch((error) => { console.log(error);
    });
});

// route to login page
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// route to login by post method
app.post('/login', async (req, res) => {
    axios.post(`${base}/user/login`, req.body)
        .then((response) => {
            console.log(response.data);
            if (response.data.statuslogin == true) {
                app.locals.user = response.data.user;
                res.redirect('/');
            } else {
                app.locals.loginError = true;
                res.render('login.ejs',{loginErrorMessage: response.data.message});
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
    axios.post(`${base}/user/update/${app.locals.user.userId}`, req.body)
    .then((response) => {
        if (response.data.statusUpdate) {
            app.locals.user = response.data.user;
            res.render('profile.ejs',{updateErrorMessage: response.data.message});
        }else {
            app.locals.updateError = true;
            res.render('profile.ejs',{updateErrorMessage: response.data.message});
        }
    })
    .catch((err) => {
        res.render('profile.ejs', {data: app.locals.user});
    });
});

// route to delete profile or user
app.get('/deleteprofile', (req, res) => {
    axios.get(`${base}/user/delete/${app.locals.user.userId}`)
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
        res.render('menu.ejs', {bread: response.data});
    }).catch(error => {
        res.redirect('/');
    });
});

// route to get bread data by category
app.get('/bread/:breadType', (req, res) => {
    axios.get(`${base}/bread/type/${req.params.breadType}`)
  .then((response) => {
    // console.log(req.params.breadType);
    res.render('menu.ejs', {bread: response.data});
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
        axios.get(`${base}/cart/getDetail/${app.locals.user.userId}`)
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
    let userArray = [];
    axios.get(`${base}/order/getAll`)
    .then(async responseOrder => {
        for (let i = 0; i < responseOrder.data.length; i++) {
            const User = await axios.get(`${base}/user/getUser/${responseOrder.data[i].user_id}`);
            userArray.push(User.data.fname);
        }
        app.locals.order = responseOrder.data;
        res.render('order.ejs', {order: app.locals.order, userArray: userArray});
    }).catch(error => {
        res.redirect('/');
    });
});

// continute coding this route ..................
// route to get all my orders by user id
app.get('/myorder', (req, res) => {
    axios.get(`${base}/order/getAll/${app.locals.user.userId}`)
    .then(async response => {
        app.locals.myorder = response.data;
        let myOrderDetailArray = [];
        for (let i = 0; i < app.locals.myorder.length; i++) {
            const myOrderDtail = await axios.get(`${base}/order/detail/${app.locals.myorder[i].order_id}`);
            myOrderDetailArray.push(myOrderDtail.data);
        }
        res.render('myorder.ejs', {myorder: app.locals.myorder, myOrderDetailArray: myOrderDetailArray});
    }).catch(error => {
        res.redirect('/');
    });
});

// route to update order status
app.get('/updateStatus/:orderId', (req, res) => {
    axios.post(`${base}/order/update/status/${req.params.orderId}`)
    .then(response => {
        res.redirect('/order');
    }).catch(error => {
        res.redirect('/');
    });
});

// route to get detail of order 
app.get('/orderDetail/:orderId', (req, res) => {
    axios.get(`${base}/order/detail/${req.params.orderId}`)
    .then(response => {
        app.locals.orderDetail = response.data;
        res.render('orderDetail.ejs', {orderDetail: app.locals.orderDetail});
    }).catch(error => {
        console.log(error);
        res.redirect('/');
    });
});

app.post
  app.listen(5000, () => {
    console.log('Server is running at http://localhost:5000/');
});