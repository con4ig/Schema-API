import express, { Request, Response } from "express";
import Notification from "../models/Notification";

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification updated
 */
router.put(
  "/:id/read",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        res.status(404).json({ msg: "Notification not found" });
        return;
      }

      notification.read = true;
      await notification.save();
      res.json(notification);
    } catch (err) {
      console.error((err as Error).message);
      res.status(500).send("Server Error");
    }
  },
);

/**
 * @swagger
 * /api/notifications/read:
 *   delete:
 *     summary: Clear all read notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications cleared
 */
router.delete("/read", async (_req: Request, res: Response): Promise<void> => {
  try {
    await Notification.deleteMany({ read: true });
    res.json({ msg: "Read notifications cleared" });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/notifications/:id - Delete a specific notification
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404).json({ msg: "Notification not found" });
      return;
    }
    await notification.deleteOne();
    res.json({ msg: "Notification removed" });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    await Notification.deleteMany({});
    res.json({ msg: "All notifications cleared" });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
});

export default router;
