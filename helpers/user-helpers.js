const db = require('../config/connection');
const collection = require('../config/collections');
const crypto = require('crypto');
const { resolve } = require('path');
const { rejects } = require('assert');
const { ObjectId } = require('mongodb');
const { response } = require('express');


module.exports = {
  doSignup: async (userData) => {
    console.log("data", userData);
    try {
      const hashedPassword = crypto.createHash('sha256').update(userData.Password).digest('hex');
      userData.Password = hashedPassword;
      const result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
      console.log(userData);
      return result.userData;
    } catch (error) {
      console.error(error);
      throw new Error('Error creating user');
    }
  },
  doLogin: async (userData) => {
    try {
      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });
      if (user) {
        const hashedPassword = crypto.createHash('sha256').update(userData.Password).digest('hex');
        if (hashedPassword === user.Password) {
          console.log("Login successful");
          return { status: true, user  };
          
        } else {
          console.log("Invalid credentials");
          return { status: false };
        }
      } else {
        console.log("User not found");
        return { status: false };
      }
    } catch (error) {
      console.error(error);
      throw new Error('Error logging in user');
    }
  },
  addToCart:(proId,userId)=>{
    return new Promise(async(resolve,reject)=>{
      let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
      if(userCart){
        db.get().collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId)},
          {
            
            $push:{products:new ObjectId(proId)}
            
          }
        ).then((response)=>{
          resolve()
        })
      }else{
        let cartObj={
          user:new ObjectId(userId),
          products:[new ObjectId(proId)]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
          resolve()
        })
      }
    })
  },
  getCartProduct:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match:{user:new ObjectId(userId)}
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            let:{prodList:'$products'},
            pipeline:[
              {
                $match:{
                  $expr:{
                    $in:['$_id',"$$prodList"]
                  }
                }
              }
            ],
            as:'cartItems'
          }
        }
      ]).toArray()
      resolve(cartItems[0].cartItems)
    })
  },
  getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let count=0
      let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
      if(cart){
        count=cart.products.length
      }
      resolve(count)
    })
  }
};
