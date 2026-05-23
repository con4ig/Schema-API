import { describe, it, expect } from "vitest";
import { validateNip, validateVat, validateInvoice } from "./validation";
import { GeminiExtractedData } from "../types";

describe("Validation Utility Tests", () => {
  describe("NIP Integrity Validation", () => {
    it("should return null if NIP matches company settings", () => {
      const result = validateNip("5252528085", "5252528085");
      expect(result).toBeNull();
    });

    it("should return 'Missing Buyer NIP' if buyer NIP is empty or missing", () => {
      const result = validateNip(null, "5252528085");
      expect(result).toBe("Missing Buyer NIP");
    });

    it("should return mismatch error if NIP does not match company settings", () => {
      const result = validateNip("1111111111", "5252528085");
      expect(result).toBe("Buyer NIP does not match company settings");
    });

    it("should return null if no company settings NIP is defined", () => {
      const result = validateNip("5252528085", null);
      expect(result).toBeNull();
    });
  });

  describe("Mathematical VAT Validation", () => {
    it("should return null for mathematically consistent values (23% VAT)", () => {
      const result = validateVat(100.0, 123.0, 0.23);
      expect(result).toBeNull();
    });

    it("should return null for minor rounding variations (within 0.10 PLN tolerance)", () => {
      const result1 = validateVat(100.0, 123.05, 0.23);
      const result2 = validateVat(100.0, 122.95, 0.23);
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it("should return a mismatch error if deviation exceeds tolerance", () => {
      const result = validateVat(100.0, 130.0, 0.23);
      expect(result).toBe("VAT Mismatch (Expected: 123.00, Actual: 130.00)");
    });

    it("should handle custom default VAT rates", () => {
      const result = validateVat(100.0, 108.0, 0.08); // 8% VAT
      expect(result).toBeNull();
    });
  });

  describe("Composite Invoice Data Validation", () => {
    it("should return an empty array if all validations pass", () => {
      const data: Partial<GeminiExtractedData> = {
        buyer_nip: "5252528085",
        total_net: 200,
        total_gross: 246,
      };

      const anomalies = validateInvoice(data, "5252528085", 0.23);
      expect(anomalies).toEqual([]);
    });

    it("should aggregate all validation errors if multiple failures occur", () => {
      const data: Partial<GeminiExtractedData> = {
        buyer_nip: "1111111111", // Mismatch NIP
        total_net: 200,
        total_gross: 300, // VAT mismatch (Expected 246)
      };

      const anomalies = validateInvoice(data, "5252528085", 0.23);
      expect(anomalies).toContain("Buyer NIP does not match company settings");
      expect(anomalies.some((err) => err.startsWith("VAT Mismatch"))).toBe(true);
      expect(anomalies.length).toBe(2);
    });
  });
});
