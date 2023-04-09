var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-add')

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    console.log(products);
    res.render('user/view-products',{admin : true,products})

  })

  
  res.render('index', {products,admin:false});
});

module.exports = router;
