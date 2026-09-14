const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
    },
    role : {
        type : String,
        enum : ["student", "faculty", "admin"],
        default : "student"
    }
})

const userModel = mongoose.model("Users", userSchema);

module.exports = userModel;