const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'echovault_super_secret_jarvis_core_key';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token format is invalid.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token is invalid or has expired.' });
  }
};
