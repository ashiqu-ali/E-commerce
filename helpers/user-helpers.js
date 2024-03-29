const db = require('../config/connection');
const collection = require('../config/collections');
const crypto = require('crypto');
const { resolve } = require('path');
const { rejects } = require('assert');
const { ObjectId } = require('mongodb');
const { response } = require('express');
const { request } = require('http');

//Razorpay
const Razorpay=require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_ka8ZlOSOMmMDyR',
  key_secret: 'Us9aju5semX15i74nKM9j5im',
});


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
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        console.log("removed");
        db.get().collection(collection.CART_COLLECTION).updateOne(
          {
            _id: new ObjectId(details.cart)
          },
          {
            $pull: {
              products: {
                item: new ObjectId(details.product)
              }
            }
          }
        ).then(() => {
          resolve({ removeProduct: true });
        }).catch((error) => {
          reject(error);
        });
      } else {
        db.get().collection(collection.CART_COLLECTION).updateOne(
          {
            _id: new ObjectId(details.cart),
            'products.item': new ObjectId(details.product)
          },
          {
            $inc: {
              'products.$.quantity': details.count
            }
          }
        ).then((response) => {
          resolve({ status: true })
        })
      }
    });
  },
  removeProduct: (details) => {
    return new Promise((resolve, reject) => {
      // Update the quantity of the product in the cart
      db.get().collection(collection.CART_COLLECTION).updateOne(
        {
          _id: new ObjectId(details.cart)
        },
        {
          $pull: {
            products: {
              item: new ObjectId(details.product)
            }
          }
        }
      ).then(() => {
        resolve(response);
      })
    })
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
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
        },

        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  { $toInt: "$quantity" },
                  { $toInt: "$product.Price" }
                ]
              }
            }
          }
        }

      ]).toArray()
      resolve(total.length ? total[0].total : 0)
    })
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, rejects) => {
      console.log(order, products, total);
      let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode
        },
        userId: new ObjectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmount: total,
        status: status,
        date:new Date()
      }

      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
        id=new ObjectId(response.insertedId)
        console.log(response.insertedId);
        resolve(response.insertedId)
      })
    })
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
      console.log(cart);
      resolve(cart.products)
    })
  },
  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()
      console.log(orders);
      resolve(orders)
    })
  },
  getOrderProducts: (orderId) => {
    console.log(orderId)
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: new ObjectId(orderId) }
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
        },
      ]).toArray()
      console.log(orderItems);
      resolve(orderItems)
    })

  },
  generateRazorpay: (orderId,total) => {
    return new Promise((resolve,reject)  => {
      var options={
        amount:total*100,
        currency:"INR",
        receipt:""+orderId 
      }
      instance.orders.create(options,(err,order)=>{
        if(err){
          console.log(err);
        }
        console.log("order :",order);
        resolve(order)
      })
    })
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      var hmac=crypto.createHmac('sha256','Us9aju5semX15i74nKM9j5im')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { status: 'placed' } }
        )
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  

};
