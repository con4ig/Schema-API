const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({
  company_nip: {
    type: String,
    default: null,
    trim: true
  },
  default_vat_rate: {
    type: Number,
    default: 0.23
  },
  custom_categories: {
    type: [String],
    default: ["Office", "Electronics", "Services", "Transport", "Other"]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// We only need one settings document for this single-user MVP
module.exports = mongoose.model("Setting", SettingSchema);
