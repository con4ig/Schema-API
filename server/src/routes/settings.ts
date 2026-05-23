import express, { Request, Response } from "express";
import Setting from "../models/Settings";

const router = express.Router();

interface SettingsBody {
  company_nip?: string;
  default_vat_rate?: number;
  custom_categories?: string[];
}

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
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error((err as Error).message);
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
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { company_nip, custom_categories } = req.body as SettingsBody;

  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (company_nip !== undefined) settings.company_nip = company_nip;
    if (custom_categories !== undefined)
      settings.custom_categories = custom_categories;

    settings.updatedAt = new Date();
    await settings.save();

    res.json(settings);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
});

export default router;
