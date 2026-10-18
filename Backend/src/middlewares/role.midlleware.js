const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (req.user.role === 'faculty' && ['pending', 'rejected'].includes(req.user.status)) {
            return res.status(403).json({
                message: req.user.status === 'rejected'
                    ? 'Your faculty account was rejected.'
                    : 'Your faculty account is pending approval.'
            });
        }

        if (req.user.role === 'admin' && ['pending', 'rejected'].includes(req.user.status)) {
            return res.status(403).json({ message: 'Your admin account is not active.' });
        }

        next();
    };
};

module.exports = authorizeRoles;