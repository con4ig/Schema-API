import mongoose, { Schema, Model } from "mongoose";
import { IInvoice, InvoiceDocument } from "../types";

/**
 * Invoice Schema
 * Defines the structure for analyzed financial documents.
 * Includes AI-extracted data, anomaly flags, and original image storage.
 */
const InvoiceSchema = new Schema<InvoiceDocument>({
  vendor_name: { type: String, required: true },
  date: { type: String },
  total_net: { type: Number, required: true },
  total_gross: { type: Number },
  category: { type: String },
  anomaly_detected: { type: String, default: null },
  original_filename: { type: String },
  image_data: { type: String },
  mime_type: { type: String },
  buyer_nip: { type: String, default: null },
  status: {
    type: String,
    enum: ["approved", "pending", "rejected"],
    default: "pending",
  },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Invoice: Model<InvoiceDocument> = mongoose.model<InvoiceDocument>(
  "Invoice",
  InvoiceSchema,
);

export default Invoice;
