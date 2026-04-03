const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  completed: { type: Boolean, default: false }
}, { _id: false });

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '⭐' },
  color: { type: String, default: '#6C63FF' },
  days: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 1=Mon ... 6=Sat
  logs: [logSchema],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Get log for a specific date
habitSchema.methods.getLog = function (dateStr) {
  return this.logs.find(l => l.date === dateStr) || null;
};

module.exports = mongoose.model('Habit', habitSchema);