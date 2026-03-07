const express = require("express");
const router = express.Router();
const Setting = require("../models/Settings");

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get application settings (auto-creates if missing)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings object
 */
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

/**
 * @swagger
 * /api/settings:
 *   post:
 *     summary: Update application settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_nip:
 *                 type: string
 *               custom_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
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
