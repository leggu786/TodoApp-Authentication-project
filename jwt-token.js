const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_secret_key';

function generateToken(user) {
    return jwt.sign({ username: user.username, _id: user._id }, JWT_SECRET);
}

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('Unauthorized');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Forbidden');
        req.user = user;
        next();
    });
}

module.exports = {
    generateToken,
    authenticateToken
};
