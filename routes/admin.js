var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper=require('../helpers/product-add')
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/view-products',{admin : true,products})

  })

  
  
});
router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')
})
router.post('/add-product', (req,res)=>{
  
  productHelper.addProduct(req.body,(productId)=>{
    let image = req.files.Image
    let id=productId
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/add-product")
      }else{
        console.log(err);
      }
    })
    
  })
})

module.exports = router;
