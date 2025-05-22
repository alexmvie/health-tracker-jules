const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const JWT_SECRET_PLACEHOLDER = 'your-secret-key-placeholder'; // In a real app, use process.env.JWT_SECRET

// POST /register
router.post('/register', 
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Invalid email format.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
      // In a real app, you might add more password strength rules
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Placeholder for user registration logic
    console.log(`Registration attempt for email: ${email}`);
    // In a real app:
    // 1. Check if user already exists
    // 2. Hash password
    // 3. Save user to database

    // Mock successful registration response
    const mockUser = {
      id: 'mockUserId-' + Date.now(), // Simulate a unique ID
      email: email 
    };
    res.status(201).json({ 
      message: 'User registered successfully (mock).', 
      user: mockUser 
    });
  }
);

// POST /login
router.post('/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Invalid email format.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Placeholder for user login logic
    console.log(`Login attempt for email: ${email}`);
    // In a real app:
    // 1. Find user by email
    // 2. Compare hashed password with provided password
    // (For this placeholder, we assume credentials are valid)

    // Mock successful login: Generate a JWT
    const mockUserId = 'mockUserId-' + email.split('@')[0]; // Create a somewhat unique mock ID
    const payload = {
      userId: mockUserId,
      email: email
    };

    try {
      const token = jwt.sign(
        payload, 
        JWT_SECRET_PLACEHOLDER, 
        { expiresIn: '1h' } // Token expires in 1 hour
      );
      res.status(200).json({ token: token });
    } catch (error) {
      console.error('Error signing JWT:', error);
      res.status(500).json({ message: 'Failed to sign token due to server error.' });
    }
  }
);

module.exports = router;
