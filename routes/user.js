const express = require('express');
const router = express.Router();
const productHelper = require('../helpers/product-add')
const userHelper = require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers');

const verifyLogin = (req, res, next) => {
  if (req.session.user.loggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount = null

  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render('user/view-products', { products, user, cartCount });
  });
});







router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response)
    req.session.user = response
    req.session.user.loggedIn = true
    res.redirect('/');
  })

})

//login

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {

    res.render('user/login', { "loginErr": req.session.userloginErr })
    req.session.userloginErr = null
  }

})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/');
    } else {
      req.session.userloginErr = "Invalid Credentials"
      res.redirect('/login');
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.user=null
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let totalValue = await userHelper.getTotalAmount(req.session.user._id)
  let products = await userHelper.getCartProduct(req.session.user._id)
  let user = req.session.user._id;
  console.log(user);
  res.render('user/cart', { products, user, totalValue })
})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {

  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.redirect('/')
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    let total = await userHelper.getTotalAmount(req.body.user);
    res.json({ response, total });

  })
});




router.post('/remove-product', (req, res, next) => {
  console.log(req.body);
  userHelper.removeProduct(req.body).then(async(response) => {
    let total = await userHelper.getTotalAmount(req.body.user);
    res.json({response,total});
  })
})



router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total,user:req.session.user })

})

router.post('/place-order',async(req,res)=>{
  let products=await userHelper.getCartProductList(req.body.userId)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  userHelpers.placeOrder(req.body,products,total).then((orderId)=>{
    console.log(orderId);
    if(req.body["payment-method"]==="COD")
    {
      res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,total).then((response)=>{
        res.json(response)
      })
    }
  })
  console.log(req.body);
})

router.get('/order-placed', (req, res) => {
  res.render('user/placed',{user:req.session.user});
});

router.get('/order',verifyLogin, async(req, res) => {
  let orders=await userHelper.getUserOrder(req.session.user._id)
  res.render('user/order',{user:req.session.user,orders});
});

router.get('/view-order-product/:id',verifyLogin,async(req,res)=>{
  console.log(req.params.id);
  let products=await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-product',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false,errMsg:'Payment Failed'})
  })
})

module.exports = router;
