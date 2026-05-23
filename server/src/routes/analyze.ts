import express, { Request, Response } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Invoice from "../models/Invoice";
import Setting from "../models/Settings";
import Notification from "../models/Notification";
import { GeminiExtractedData } from "../types";
import { validateInvoice } from "../utils/validation";

const router = express.Router();

// Multer Setup - Memory Storage (Crucial for performance/MVP)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * AI Model Setup
 * Using Google Gemini 2.5 Flash for high-speed OCR and financial analysis.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

/**
 * @swagger
 * /api/analyze:
 *   get:
 *     summary: Retrieve all scanned and analyzed invoices
 *     tags: [Analysis]
 *     responses:
 *       200:
 *         description: List of analyzed invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    // Data Normalization Layer
    const normalizedInvoices = invoices.map((inv) => {
      const invoiceObj = inv.toObject();
      return {
        ...invoiceObj,
        status: invoiceObj.status || "pending",
        isArchived:
          invoiceObj.isArchived === undefined ? false : invoiceObj.isArchived,
      };
    });

    res.json(normalizedInvoices);
  } catch (error) {
    console.error("Fetch Error:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve invoices from database." });
  }
});

/**
 * @swagger
 * /api/analyze/upload:
 *   post:
 *     summary: Upload and intelligently analyze an invoice (PDF/Image)
 *     tags: [Analysis]
 *     description: Uses Google Gemini 2.5 Flash to automatically extract data and detect anomalies.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               invoice:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully analyzed invoice
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Bad request (no file or unsupported format)
 *       500:
 *         description: AI analysis or server error
 */
router.post(
  "/upload",
  upload.single("invoice"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({ error: "No image file provided for analysis." });
        return;
      }

      console.log(`[AI ENGINE] Processing: ${req.file.originalname}`);

      // Define the Extraction Prompt with Schema Enforcement
      const extractionPrompt = `You are a professional AI OCR system for analyzing financial documents.
                        Your task is to precisely extract data from the uploaded invoice or receipt image.

                        Return ONLY a clean JSON object, without any additional comments, introductions, or Markdown formatting (no \`\`\`json).
                        If you are not sure about a value, enter 0 and describe it in anomaly_detected.

                        Here is the JSON structure you must return:
                        {
                            "vendor_name": "Full name of the document issuer.",
                            "date": "Issue date in YYYY-MM-DD format.",
                            "total_net": "Total net amount (number).",
                            "total_gross": "Total gross amount (number).",
                            "category": "Assign one of the categories: [MATERIALS, FUEL, LOGISTICS, SERVICES, OFFICE].",
                            "buyer_nip": "Identify the Buyer's NIP (Tax Identification Number). Return ONLY the digits, e.g., '5252528085'. If not found, return null.",
                            "anomaly_detected": "Check for errors. Return 'null' if okay. If NIP is missing, return 'Missing Buyer NIP'. If dates are illogical, return 'Invalid date'.",
                            "original_filename": "${req.file.originalname}"
                        }

                        IMPORTANT: Use the ISO 8601 date format YYYY-MM-DD.
                        `;

      // Execute AI Analysis
      const aiResult = await model.generateContent([
        extractionPrompt,
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: req.file.mimetype,
          },
        },
      ]);

      const aiResponse = aiResult.response;
      const rawAiText = aiResponse.text();

      console.log("[AI ENGINE] Raw Response Received.");

      let extractedInvoiceData: GeminiExtractedData;
      try {
        extractedInvoiceData = JSON.parse(rawAiText) as GeminiExtractedData;
      } catch (parseError) {
        console.error("[AI ENGINE] JSON Parsing Failure:", parseError);
        res.status(500).json({
          error: "AI returned malformed data.",
          details: rawAiText,
        });
        return;
      }

      // --- BUSINESS LOGIC VALIDATION LAYER ---

      const appSettings = await Setting.findOne();
      const configuredCompanyNip = appSettings ? appSettings.company_nip : null;
      const defaultVatRate = appSettings ? appSettings.default_vat_rate : 0.23;

      const anomalies = validateInvoice(extractedInvoiceData, configuredCompanyNip, defaultVatRate);

      // Create warnings notifications for each validation anomaly detected
      for (const anomaly of anomalies) {
        if (anomaly === "Missing Buyer NIP") {
          await Notification.create({
            type: "warning",
            message: `Warning: No Buyer NIP found on document from ${extractedInvoiceData.vendor_name || "Unknown"}.`,
            read: false,
          });
        } else if (anomaly === "Buyer NIP does not match company settings") {
          await Notification.create({
            type: "warning",
            message: `Tax ID Mismatch: Found ${extractedInvoiceData.buyer_nip}, expected ${configuredCompanyNip}.`,
            read: false,
          });
        } else if (anomaly.startsWith("VAT Mismatch")) {
          await Notification.create({
            type: "warning",
            message: `Calculation Warning: VAT discrepancy detected for ${extractedInvoiceData.vendor_name || "Unknown"}.`,
            read: false,
          });
        }
      }

      // 2. Duplicate Detection (Vendor + Date + Amount)
      const existingRecord = await Invoice.findOne({
        vendor_name: extractedInvoiceData.vendor_name,
        date: extractedInvoiceData.date,
        total_gross: extractedInvoiceData.total_gross,
      });

      if (existingRecord) {
        const duplicateError = "Possible duplicate detected";
        anomalies.push(duplicateError);

        await Notification.create({
          type: "warning",
          message: `Duplicate Alert: Document from ${extractedInvoiceData.vendor_name} for ${extractedInvoiceData.total_gross} PLN already exists.`,
          read: false,
        });
      }

      // Persist status according to anomalies presence
      extractedInvoiceData.anomaly_detected = anomalies.length > 0 ? anomalies.join(", ") : null;

      // Persistence Strategy
      const finalInvoiceRecord = new Invoice({
        ...extractedInvoiceData,
        original_filename: req.file.originalname,
        image_data: req.file.buffer.toString("base64"),
        mime_type: req.file.mimetype,
        status: extractedInvoiceData.anomaly_detected
          ? "pending"
          : "approved",
      });

      await finalInvoiceRecord.save();
      console.log(
        `[DATABASE] Record preserved with ID: ${finalInvoiceRecord._id}`,
      );

      res.json({ success: true, data: finalInvoiceRecord });
    } catch (globalError) {
      console.error("❌ Pipeline Failure:", globalError);
      res
        .status(500)
        .json({ error: "Internal server error during document processing." });
    }
  },
);

export default router;
