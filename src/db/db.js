const mongoose = require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log('database connection successful.');
    }
    catch(err){
        console.log('database connection failed.', err);
    }
    
}

module.exports = connectDB;