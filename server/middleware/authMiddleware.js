const jwt = require('jsonwebtoken');
const JWT_SECRET_PLACEHOLDER = 'your-secret-key-placeholder'; // In a real app, use process.env.JWT_SECRET

/**
 * Middleware to protect routes by verifying JWT.
 * Expects a token in the 'Authorization' header with 'Bearer ' prefix.
 */
function protect(req, res, next) {
  let token;

  // Check for Authorization header and Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET_PLACEHOLDER);

      // Add decoded user information to the request object
      // In a real app, you might fetch the user from DB here to ensure they still exist/are active
      req.user = decoded; // Contains { userId: 'mockUserId', email: 'user@example.com', iat: ..., exp: ... }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('JWT verification error:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, token failed (invalid signature or malformed).' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      // For other errors during verification
      return res.status(401).json({ message: 'Not authorized, token verification failed for other reasons.' });
    }
  }

  if (!token) {
    // This case handles when there's no Authorization header or it doesn't start with 'Bearer '
    return res.status(401).json({ message: 'Not authorized, no token provided or malformed header.' });
  }
}

module.exports = { protect };
