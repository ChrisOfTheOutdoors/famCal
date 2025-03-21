const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Reservation = require("../models/Reservation");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ GET All Users + Next Booking Date
router.get("/users", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ error: "Access denied" });

        const users = await User.find().lean();
        
        for (let user of users) {
            const nextBooking = await Reservation.findOne({ email: user.email })
                .sort({ startDate: 1 })
                .select("startDate")
                .lean();
            
            user.nextBooking = nextBooking ? nextBooking.startDate : null;
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ DELETE User
router.delete("/users/:id", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ error: "Access denied" });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
