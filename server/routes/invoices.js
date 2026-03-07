const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const { Parser } = require("json2csv");

/**
 * @swagger
 * /api/invoices/archive:
 *   put:
 *     summary: Bulk archive invoices
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successfully archived invoices
 */
router.put("/archive", async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ msg: "No invoice IDs provided" });
    }

    const result = await Invoice.updateMany(
      { _id: { $in: invoiceIds } },
      { $set: { isArchived: true } }
    );
    res.json({ message: `Archived ${result.modifiedCount} invoices`, count: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/**
 * @swagger
 * /api/invoices/export:
 *   get:
 *     summary: Export approved invoices to CSV
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: CSV file containing invoice data
 */
router.get("/export", async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: "approved" }).lean();

    if (invoices.length === 0) {
      return res.status(404).json({ msg: "No approved invoices to export" });
    }

    const fields = ["vendor_name", "date", "total_net", "total_gross", "category", "buyer_nip", "status", "createdAt"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(invoices);

    res.header("Content-Type", "text/csv");
    res.attachment(`invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// PUT /api/invoices/:id/restore - Restore from archive
router.put("/:id/restore", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/**
 * @swagger
 * /api/invoices/{id}/approve:
 *   put:
 *     summary: Force approve an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice approved
 */
router.put("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { vendor_name, date, total_net, total_gross, category } = req.body;

    // Build update object
    const updateFields = {
      status: "approved",
      anomaly_detected: null
    };

    if (Object.keys(req.body).length > 0) {
      const net = parseFloat(total_net);
      const gross = parseFloat(total_gross);

      // Validation check on incoming data
      if (!isNaN(net) && !isNaN(gross) && net === gross && net > 0) {
        return res.status(400).json({
          msg: "Cannot approve invoice with identical net and gross amounts (VAT Error). Please correct the data first."
        });
      }

      if (vendor_name) updateFields.vendor_name = vendor_name;
      if (date) updateFields.date = date;
      if (category) updateFields.category = category;

      // Ensure numbers are actually numbers or null/undefined
      if (total_net !== undefined && total_net !== "") updateFields.total_net = net;
      if (total_gross !== undefined && total_gross !== "") updateFields.total_gross = gross;
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: false } // runValidators: false for legacy data compatibility
    );

    if (!invoice) {
      return res.status(404).json({ msg: "Invoice not found" });
    }

    // Final verification check on the updated record (in case of no body provided)
    const finalNet = parseFloat(invoice.total_net);
    const finalGross = parseFloat(invoice.total_gross);

    if (!isNaN(finalNet) && !isNaN(finalGross) && finalNet === finalGross && finalNet > 0) {
      // Revert status if somehow it saved invalid data (shouldn't happen with our logic above)
      await Invoice.findByIdAndUpdate(id, { status: "pending" });
      return res.status(400).json({
        msg: "Cannot approve invoice with identical net and gross amounts (VAT Error)."
      });
    }

    res.json(invoice);
  } catch (err) {
    console.error("Error in /approve route:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
});

// PUT /api/invoices/:id - Update invoice details (Unlock editing)
router.put("/:id", async (req, res) => {
  try {
    const { vendor_name, date, total_net, total_gross, category, buyer_nip } = req.body;

    const net = parseFloat(total_net);
    const gross = parseFloat(total_gross);

    if (!isNaN(net) && !isNaN(gross) && net === gross && net > 0) {
      return res.status(400).json({
        msg: "Net and gross amounts cannot be identical (VAT Error). Please correct the data."
      });
    }

    // Build update object
    const updateFields = {};
    if (vendor_name) updateFields.vendor_name = vendor_name;
    if (date) updateFields.date = date;
    if (total_net !== undefined) updateFields.total_net = total_net;
    if (total_gross !== undefined) updateFields.total_gross = total_gross;
    if (category) updateFields.category = category;
    if (buyer_nip) updateFields.buyer_nip = buyer_nip;

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ msg: "Invoice not found" });
    }
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The invoice ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invoice deleted
 *       404:
 *         description: Invoice not found
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await Invoice.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
