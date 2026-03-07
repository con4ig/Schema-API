const express = require("express");
const router = express.Router();
const Setting = require("../models/Settings");

// GET /api/settings - Get settings (create default if not exists)
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// POST /api/settings - Update settings
router.post("/", async (req, res) => {
  const { company_nip, custom_categories } = req.body;

  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (company_nip !== undefined) settings.company_nip = company_nip;
    if (custom_categories !== undefined) settings.custom_categories = custom_categories;

    settings.updatedAt = Date.now();
    await settings.save();

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
