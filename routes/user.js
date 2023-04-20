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
router.get('/', function(req, res, next) {
  let user = req.session.user;
  console.log(user);
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render('user/view-products', { products, user });
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

router.get('/cart',verifyLogin,(req,res)=>{

  res.render('user/cart')
})


module.exports = router;
