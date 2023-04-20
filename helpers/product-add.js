var db=require('../config/connection')
var collection=require('../config/collections')
const { response } = require('express')
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
        

        db.get().collection('product').insertOne(product).then((data)=>{
            
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            console.log(new objectId(proId));

            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id: new objectId(proId)}, (err, response) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(response)
                }
              }).then((response)=>{
                resolve(response)
              })
              
        })
    }

}