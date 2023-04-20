const db = require('../config/connection');
const collection = require('../config/collections');
const crypto = require('crypto');

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
  }
};
