const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
 const token = req.headers['authorization']?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }
  jwt.verify(token, 'your_access_token_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};