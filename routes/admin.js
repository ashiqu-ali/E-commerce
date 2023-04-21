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
router.get('/add-product',(req,res,next)=>{
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

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
  
})

router.get('/edit-product/:id',async(req,res)=>{
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


module.exports = router;
