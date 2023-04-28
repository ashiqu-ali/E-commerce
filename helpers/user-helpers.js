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
          return { status: true, user };

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
  addToCart: (proId, userId) => {
    let proObj = {
      item: new ObjectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        if (proExist != -1) {
          db.get().collection(collection.CART_COLLECTION).updateOne({
            'products.item': new ObjectId(proId)
          },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then(() => {
            resolve()
          })
        }
        else {
          db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) },
            {

              $push: { products: proObj }

            }
          ).then((response) => {
            resolve()
          })
        }
        console.log(proExist);


      } else {
        let cartObj = {
          user: new ObjectId(userId),
          products: [proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
  getCartProduct: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: new ObjectId(userId) }
        },
        {
          $unwind: '$products'

        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        

      ]).toArray()

      resolve(cartItems)
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })
  },
  decQuantity: (productId) => {
    return new Promise(async (resolve, reject) => {
      const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new objectId(productId) });
      if (product.quantity > 1) {
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
          $inc: {
            quantity: -1
          }
        }).then(() => {
          resolve();
        });
      } else {
        reject('Minimum quantity reached');
      }
    });
  },


  incQuantity: (proId) => {
    let proObj = {
      item: new ObjectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      const productExistsInCart = userCart.products.findIndex(product => product.item == proId)
      console.log(proId);
      
      if (productExistsInCart) {
        db.get().collection(collection.CART_COLLECTION).updateOne({
          'products.item': new ObjectId(proObj)
        },
          {
            $inc: { 'products.$.quantity': 1 }
          }
        ).then(() => {
          resolve()
        })
      } else {
        reject('Product does not exist in cart');
      }
    });
  },
  
};
