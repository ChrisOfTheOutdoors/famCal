const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Reservation = require('../models/Reservation'); // Import Reservation model
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

// ✅ JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;  // Attach user ID to request
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

// ✅ Admin Access Middleware
const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// ✅ Register a New User
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, isAdmin: false });
        await user.save();

        // Generate JWT Token
        const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Login a User
router.post('/login', [
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT Token
        const payload = { user: { id: user.id, isAdmin: user.isAdmin } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Get Current User (Protected Route)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ GET All Users (Admin Only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ DELETE a User (Admin Only)
router.delete('/delete-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete all reservations associated with the user
        await Reservation.deleteMany({ userId: user._id });

        await user.deleteOne();
        res.json({ message: "User and their reservations deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Promote a User to Admin (Admin Only)
router.put('/make-admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.isAdmin = true;
        await user.save();
        res.json({ message: "User promoted to admin successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ UPDATE User Profile (User Only)
router.put('/update-profile', authMiddleware, async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        // If updating password, hash it before saving
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ REQUEST Password Reset (Send Email)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set expiration time (1 hour)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        // Email setup
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email message
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            text: `You have requested a password reset. Click the link below to reset your password:\n\nhttp://yourfrontendurl.com/reset-password/${resetToken}\n\nIf you did not request this, please ignore this email.`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ RESET Password (Submit New Password)
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() } // Check if token is still valid
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear the reset token fields
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();
        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
