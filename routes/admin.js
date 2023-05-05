var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper=require('../helpers/product-add')

//verify admin is loggedIn or nor
const verifyLogin = (req, res, next) => {
  if (req.session.admin.loggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/view-products',{admin : true,products})

  })

  
  
});
router.get('/add-product',verifyLogin,(req,res,next)=>{
  res.render('admin/add-product',{admin : true})
})
router.post('/add-product', (req,res)=>{
  
  productHelper.addProduct(req.body,(productId)=>{
    let image = req.files.Image
    let id=productId
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/add-product",{admin : true})
      }else{
        console.log(err);
      }
    })
    
  })
})

router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
  
})

router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product,admin : true})
  
  
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    if(req.files && req.files.Image){ // check if req.files.Image exists
      let image=req.files.Image
      image.mv('./public/product-images/'+req.params.id+'.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      })
    }
    res.redirect('/admin')
  })
})

//login

router.get('/admin/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/')
  } else {

    res.render('admin/login', { "loginErr": req.session.userloginErr })
    req.session.adminLoginErr = null
  }

})

router.post('/admin/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin
      req.session.admin.loggedIn = true
      res.redirect('/');
    } else {
      req.session.adminLoginErr = "Invalid Credentials"
      res.redirect('/login');
    }
  });
});

module.exports = router;
