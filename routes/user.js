const express = require('express');
const router = express.Router();
const productHelper=require('../helpers/product-add')
const userHelper=require('../helpers/user-helpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount=null
  
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render('user/view-products', { products, user,cartCount });
  });
});


  


router.get('/login', (req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{

    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=null
  }
  
})

router.get('/signup', (req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response)
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/');
  })

})

//login

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/');
    } else {
      req.session.loginErr="Invalid Credentials"
      res.redirect('/login');
    }
  });
});

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await userHelper.getCartProduct(req.session.user._id)
  let user = req.session.user;
  console.log(products);
  res.render('user/cart',{products,user})
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/')
  })
})

router.post('/change-product-quantity', (req, res) => {
  userHelper.changeProductQuantity(req.body).then((updatedCart) => {
      res.json(updatedCart);
  }).catch((error) => {
      console.log(error);
      res.json({ error: true });
  });
});




router.post('/remove-product',(req,res,next)=>{
  console.log(req.body);
  userHelper.removeProduct(req.body).then(()=>{
    res.redirect('/cart'); 
  })
})



router.get('/place-order',verifyLogin,async (req,res)=>{
  lettotal=await userHelper.getTotalAmount(req.session._id)
  res.render('user/place-order')
})

module.exports = router;
