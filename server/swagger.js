const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Profit Lens Core API",
      version: "1.0.0",
      description: "Enterprise-Grade Financial Intelligence Engine powered by Google Gemini 2.5 Flash. Automated OCR Extraction, Real-time Margin Tracking, and Intelligent Anomaly Detection.",
      contact: {
        name: "Szymon Wira",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Invoice: {
          type: "object",
          properties: {
            _id: { type: "string" },
            vendor_name: { type: "string" },
            date: { type: "string", format: "date" },
            total_net: { type: "number" },
            total_gross: { type: "number" },
            category: { type: "string" },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
            anomaly_detected: { type: "string", nullable: true },
            isArchived: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            invoiceId: { type: "string" },
            message: { type: "string" },
            type: { type: "string", enum: ["info", "warning", "error"] },
            read: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
