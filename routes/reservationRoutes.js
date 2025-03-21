const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

// Nodemailer setup for email notifications
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ Middleware for JWT Authentication
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

// ✅ Middleware for Admin Access
const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// ✅ GET All Reservations (Admin Only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ startDate: 1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ GET User's Own Reservations
router.get('/my-reservations', authMiddleware, async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id }).sort({ startDate: 1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ POST Create a New Reservation (User Only)
router.post('/reserve', authMiddleware, async (req, res) => {
    const { name, email, startDate, nights } = req.body;

    if (!name || !email || !startDate || !nights) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const newReservation = new Reservation({
            name,
            email,
            startDate,
            nights,
            userId: req.user.id // Attach the user ID
        });
        await newReservation.save();

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "russ@example.com", // Update this to Russ's actual email
            subject: "New Reservation Created",
            text: `${name} has booked from ${startDate} for ${nights} nights.`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "Reservation created & email sent" });
    } catch (error) {
        res.status(500).json({ error: "Could not create reservation" });
    }
});

// ✅ PUT Update a Reservation (User Only)
router.put('/update/:id', authMiddleware, async (req, res) => {
    const { startDate, nights } = req.body;

    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Only allow the user who created the reservation to edit it
        if (reservation.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to edit this reservation" });
        }

        // Update fields
        if (startDate) reservation.startDate = startDate;
        if (nights) reservation.nights = nights;

        await reservation.save();
        res.json({ message: "Reservation updated successfully", reservation });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ DELETE a Reservation (User Only)
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Only allow the user who created the reservation to delete it
        if (reservation.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this reservation" });
        }

        await reservation.deleteOne();
        res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ DELETE Any Reservation (Admin Only)
router.delete('/admin/delete/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        await reservation.deleteOne();
        res.json({ message: "Reservation deleted by admin" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ PUT Update Any Reservation (Admin Only)
router.put('/admin/update/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { startDate, nights } = req.body;

    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        if (startDate) reservation.startDate = startDate;
        if (nights) reservation.nights = nights;

        await reservation.save();
        res.json({ message: "Reservation updated by admin", reservation });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
