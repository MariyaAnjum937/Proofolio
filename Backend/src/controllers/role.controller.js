const studentRole = (req, res) => {
    res.status(201).json({
        message: 'welcome student'
    });
};

const facultyRole = (req, res) => {
    res.status(201).json({
        message: 'welcome faculty'
    });
};

const adminRole = (req, res) => {
    res.status(201).json({
        message: 'welcome admin'
    });
};

module.exports = {
    studentRole,
    facultyRole,
    adminRole
};