const userModel = require('../models/user.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


async function registerUser(req, res){
    const {username, email, password} = req.body;

    const userExists = await userModel.findOne({
        $or : [
            {username}, {email}
        ]
    })

    if(userExists){
        return res.status(401).json({
            message : 'user exists'
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        username,
        email,
        password : hashedPassword
    })

    const token = jwt.sign({user_id : user._id}, process.env.JWT_SECRET);
    res.cookie("token", token);

    return res.status(201).json({
        message : 'user created successfully.',
        users : {
            username : user.username,
            email : user.email
        }
    })
}

async function loginUser(req, res){
    const {email, password} = req.body;

    const userExists = await userModel.findOne({email})

    if(!userExists){
        return res.status(401).json({
            message : 'no user found'
        })
    }

    const isMatch = await bcrypt.compare(password, userExists.password);
    if(!isMatch){
        return res.status(401).json({
            message : 'invalid credentials'
        })
    }

    const token = jwt.sign({id : userExists._id}, process.env.JWT_SECRET);
    res.cookie("token", token);

    return res.status(201).json({
        message : 'login successful.',
        user : {
            username : userExists.username,
            email : userExists.email
        }
    })
}

async function logoutUser(req, res) { 
    res.clearCookie("token"); return res.status(200).json({ message: "logout successful" });
}

module.exports = {registerUser, loginUser, logoutUser};