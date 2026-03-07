const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Invoice = require("../models/Invoice");
const Settings = require("../models/Settings");
const Notification = require("../models/Notification");

// Multer Setup - Memory Storage (Crucial for performance/MVP)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * AI Model Setup
 * Using Google Gemini 2.5 Flash for high-speed OCR and financial analysis.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

/**
 * @route GET /api/analyze
 * @desc Retrieves all analyzed invoices from the database.
 * Normalizes legacy records without status or archival flags.
 * @returns {Promise<void>} Returns a JSON array of normalized Invoice objects.
 */
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
        
    // Data Normalization Layer
    const normalizedInvoices = invoices.map(inv => {
      const invoiceObj = inv.toObject();
      return {
        ...invoiceObj,
        status: invoiceObj.status || "pending",
        isArchived: invoiceObj.isArchived === undefined ? false : invoiceObj.isArchived
      };
    });
        
    res.json(normalizedInvoices);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to retrieve invoices from database." });
  }
});

/**
 * @route POST /api/analyze
 * @desc Process an uploaded invoice image using Gemini 2.5 Flash AI.
 * Includes multi-stage validation: NIP matching, VAT consistency, and duplicate detection.
 * @param {Object} req.file - The uploaded image file from Multer memory storage.
 * @returns {Promise<void>} Returns the saved Invoice object with anomaly flags if applicable.
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided for analysis." });
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

    const aiResponse = await aiResult.response;
    const rawAiText = aiResponse.text();

    console.log("[AI ENGINE] Raw Response Received.");

    let extractedInvoiceData;
    try {
      extractedInvoiceData = JSON.parse(rawAiText);
    } catch (parseError) {
      console.error("[AI ENGINE] JSON Parsing Failure:", parseError);
      return res.status(500).json({ 
        error: "AI returned malformed data.", 
        details: rawAiText 
      });
    }

    // --- BUSINESS LOGIC VALIDATION LAYER ---

    const appSettings = await Settings.findOne();
    const configuredCompanyNip = appSettings ? appSettings.company_nip : null;

    // 1. NIP Integrity Check
    if (configuredCompanyNip && extractedInvoiceData.buyer_nip && extractedInvoiceData.buyer_nip !== configuredCompanyNip) {
      const nipMismatchError = "Buyer NIP does not match company settings";
      extractedInvoiceData.anomaly_detected = extractedInvoiceData.anomaly_detected
        ? `${extractedInvoiceData.anomaly_detected}, ${nipMismatchError}`
        : nipMismatchError;

      await Notification.create({
        type: "warning",
        message: `Tax ID Mismatch: Found ${extractedInvoiceData.buyer_nip}, expected ${configuredCompanyNip}.`,
        read: false,
      });
    }

    if (!extractedInvoiceData.buyer_nip) {
      const missingNipError = "Missing Buyer NIP";
      extractedInvoiceData.anomaly_detected = extractedInvoiceData.anomaly_detected
        ? `${extractedInvoiceData.anomaly_detected}, ${missingNipError}`
        : missingNipError;

      await Notification.create({
        type: "warning",
        message: `Warning: No Buyer NIP found on document from ${extractedInvoiceData.vendor_name}.`,
        read: false,
      });
    }

    // 2. Duplicate Detection (Vendor + Date + Amount)
    const existingRecord = await Invoice.findOne({
      vendor_name: extractedInvoiceData.vendor_name,
      date: extractedInvoiceData.date,
      total_gross: extractedInvoiceData.total_gross
    });

    if (existingRecord) {
      const duplicateError = "Possible duplicate detected";
      extractedInvoiceData.anomaly_detected = extractedInvoiceData.anomaly_detected
        ? `${extractedInvoiceData.anomaly_detected}, ${duplicateError}`
        : duplicateError;

      await Notification.create({
        type: "warning",
        message: `Duplicate Alert: Document from ${extractedInvoiceData.vendor_name} for ${extractedInvoiceData.total_gross} PLN already exists.`,
        read: false,
      });
    }

    // 3. Mathematical VAT Validation
    const netValue = parseFloat(extractedInvoiceData.total_net);
    const grossValue = parseFloat(extractedInvoiceData.total_gross);
    const defaultVatRate = appSettings ? appSettings.default_vat_rate : 0.23;

    if (!isNaN(netValue) && !isNaN(grossValue)) {
      const expectedGross = netValue * (1 + defaultVatRate);
      const deviation = Math.abs(grossValue - expectedGross);

      // Allow 0.10 PLN tolerance for rounding variations
      if (deviation > 0.10) {
        const vatErrorMsg = `VAT Mismatch (Expected: ${expectedGross.toFixed(2)}, Actual: ${grossValue.toFixed(2)})`;
        extractedInvoiceData.anomaly_detected = extractedInvoiceData.anomaly_detected
          ? `${extractedInvoiceData.anomaly_detected}, ${vatErrorMsg}`
          : vatErrorMsg;

        await Notification.create({
          type: "warning",
          message: `Calculation Warning: VAT discrepancy detected for ${extractedInvoiceData.vendor_name}.`,
          read: false,
        });
      }
    }

    // Persistence Strategy
    const finalInvoiceRecord = new Invoice({
      ...extractedInvoiceData,
      original_filename: req.file.originalname,
      image_data: req.file.buffer.toString("base64"),
      mime_type: req.file.mimetype,
      status: extractedInvoiceData.anomaly_detected ? "pending" : "approved"
    });

    await finalInvoiceRecord.save();
    console.log(`[DATABASE] Record preserved with ID: ${finalInvoiceRecord._id}`);

    res.json({ success: true, data: finalInvoiceRecord });
  } catch (globalError) {
    console.error("❌ Pipeline Failure:", globalError);
    res.status(500).json({ error: "Internal server error during document processing." });
  }
});

module.exports = router;
