const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null }, // Token for password reset
    resetPasswordExpires: { type: Date, default: null }, // Expiration time
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
