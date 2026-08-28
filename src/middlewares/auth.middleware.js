
const jwt = require("jsonwebtoken");
const User = require("../models/user.models");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required. Please login."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        
        
        // Find the user
        const user = await User.findById(decoded.id);
        

        if (!user) {
            return res.status(401).json({
                message: "User not found."
            });
        }

        // Store user information in request
        req.user = user;

        // Continue to the controller
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};

module.exports = authMiddleware;

