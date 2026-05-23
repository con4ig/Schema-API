import { Document } from "mongoose";

// ─── Domain Interfaces ───────────────────────────────────────

export interface IInvoice {
  vendor_name: string;
  date?: string;
  total_net: number;
  total_gross?: number;
  category?: string;
  anomaly_detected?: string | null;
  original_filename?: string;
  image_data?: string;
  mime_type?: string;
  buyer_nip?: string | null;
  status: "approved" | "pending" | "rejected";
  isArchived: boolean;
  createdAt: Date;
}

export interface INotification {
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: Date;
}

export interface ISetting {
  company_nip: string | null;
  default_vat_rate: number;
  custom_categories: string[];
  updatedAt: Date;
}

// ─── Mongoose Document Types ─────────────────────────────────

export type InvoiceDocument = IInvoice & Document;
export type NotificationDocument = INotification & Document;
export type SettingDocument = ISetting & Document;

// ─── AI Extraction Schema ────────────────────────────────────

export interface GeminiExtractedData {
  vendor_name: string;
  date: string;
  total_net: number;
  total_gross: number;
  category: string;
  buyer_nip: string | null;
  anomaly_detected: string | null;
  original_filename: string;
}
