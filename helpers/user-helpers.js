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
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({
              user: new ObjectId(userId), 'products.item': new ObjectId(proId)
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
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] }
          }
        }


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
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        console.log("if condition");
        db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            // Find the product by cartID, productID
            {
              _id: new ObjectId(details.cart),
              //'products.item': new ObjectId(details.product),
            },
            {
              $pull: { products: { item: new ObjectId(details.product) } }
            }
          ).then((response) => {
            // If the update is successful, resolve the promise with the response
            resolve({ removeProduct: true });
          })
          .catch((error) => {
            // If there's an error, reject the promise with the error
            reject(error);
          });

      }
      else {
        details.count = parseInt(details.count)

        db.get().collection(collection.CART_COLLECTION).updateOne(
          {
            _id: new ObjectId(details.cart),
            'products.item': new ObjectId(details.product)
          },
          {
            $inc: { 'products.$.quantity': details.count }
          }
        ).then((response) => {
          resolve(true)
        })

      }
    })

  },
  removeProduct: (details) => {
    return new Promise((resolve, reject) => {
      // Update the quantity of the product in the cart
      db.get().collection(collection.CART_COLLECTION)
        .deleteOne(
          // Find the product by cartID, productID
          {
            _id: new ObjectId(details.cart),
            'products.item': new ObjectId(details.product),
          }

        )
        .then((response) => {
          // If the update is successful, resolve the promise with the response
          resolve(response);
        })
        .catch((error) => {
          // If there's an error, reject the promise with the error
          reject(error);
        });
    });
  }


};
