const mongoose = require('mongoose')
const config = require('./config')



const connectDB = async () =>{
    try{
        await mongoose.connect(config.MONGO_URI);
        console.log("Database Connected successfully");
    }catch(error){
        console.error("Database connnection error", error);
        
    }
}


module.exports = connectDB;