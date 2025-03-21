const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    startDate: { type: Date, required: true },
    nights: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
