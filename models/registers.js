const mongoose=require('mongoose')

const userData = new mongoose.Schema({
    Name:{
        type:string,
        required:true
    },
    Email:{
        type:string,
        required:true,
        unique:true
    },
    Password:{
        type:string,
        required:true
    }

})