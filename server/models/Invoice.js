const mongoose = require('mongoose');

/**
 * Invoice Schema
 * Defines the structure for analyzed financial documents.
 * Includes AI-extracted data, anomaly flags, and original image storage.
 */
const InvoiceSchema = new mongoose.Schema({
    /** @type {String} Name of the issuing entity (extracted by AI) */
    vendor_name: { type: String, required: true },
    
    /** @type {String} Date of the transaction (extracted by AI) */
    date: { type: String },
    
    /** @type {Number} Net amount in PLN (extracted by AI) */
    total_net: { type: Number, required: true },
    
    /** @type {Number} Gross amount in PLN (calculated/extracted) */
    total_gross: { type: Number },
    
    /** @type {String} Calculated or assigned expense category */
    category: { type: String },
    
    /** @type {String|null} Description of any detected validation errors or anomalies */
    anomaly_detected: { type: String, default: null },
    
    /** @type {String} Original name of the uploaded file */
    original_filename: { type: String },
    
    /** @type {String} Base64 encoded representation of the invoice image */
    image_data: { type: String },
    
    /** @type {String} Standard MIME type (e.g., 'image/jpeg') */
    mime_type: { type: String },
    
    /** @type {'approved'|'pending'|'rejected'} Workflow status of the record */
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
    
    /** @type {Boolean} Archival flag for dashboard visibility */
    isArchived: { type: Boolean, default: false },
    
    /** @type {Date} Timestamp of record creation */
    createdAt: { type: Date, default: Date.now },
});

/**
 * @typedef {Object} Invoice
 * @property {string} vendor_name
 * @property {number} total_net
 * @property {string} [status]
 * @property {boolean} [isArchived]
 */

module.exports = mongoose.model('Invoice', InvoiceSchema);
