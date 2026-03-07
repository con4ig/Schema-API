const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET /api/notifications - Get all notifications (sorted by newest)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/notifications/read - Clear all read notifications
router.delete("/read", async (req, res) => {
  try {
    await Notification.deleteMany({ read: true });
    res.json({ msg: "Read notifications cleared" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/notifications/:id - Delete a specific notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    await notification.deleteOne();
    res.json({ msg: "Notification removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete("/", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ msg: "All notifications cleared" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
