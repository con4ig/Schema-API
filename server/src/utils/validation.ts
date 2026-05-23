import { GeminiExtractedData } from "../types";

/**
 * Validates the buyer NIP against the company settings.
 * Returns an error string if there's an anomaly, otherwise null.
 */
export function validateNip(
  buyerNip: string | null | undefined,
  configuredCompanyNip: string | null | undefined
): string | null {
  if (!buyerNip) {
    return "Missing Buyer NIP";
  }
  if (configuredCompanyNip && buyerNip !== configuredCompanyNip) {
    return "Buyer NIP does not match company settings";
  }
  return null;
}

/**
 * Validates the mathematical consistency of Net, Gross, and VAT rate.
 * Allows 0.10 PLN tolerance for rounding variations.
 * Returns an error string if there's a discrepancy, otherwise null.
 */
export function validateVat(
  netValue: number,
  grossValue: number,
  defaultVatRate: number = 0.23
): string | null {
  if (isNaN(netValue) || isNaN(grossValue)) {
    return "Invalid numeric values";
  }
  
  const expectedGross = netValue * (1 + defaultVatRate);
  const deviation = Math.abs(grossValue - expectedGross);

  if (deviation > 0.1) {
    return `VAT Mismatch (Expected: ${expectedGross.toFixed(2)}, Actual: ${grossValue.toFixed(2)})`;
  }
  return null;
}

/**
 * Composite function to validate extracted invoice data.
 * Aggregates all anomalies into an array of error messages.
 */
export function validateInvoice(
  data: Partial<GeminiExtractedData>,
  configuredCompanyNip: string | null | undefined,
  defaultVatRate: number = 0.23
): string[] {
  const anomalies: string[] = [];

  // NIP validation
  const nipError = validateNip(data.buyer_nip, configuredCompanyNip);
  if (nipError) {
    anomalies.push(nipError);
  }

  // VAT validation
  const net = Number(data.total_net);
  const gross = Number(data.total_gross);
  if (!isNaN(net) && !isNaN(gross)) {
    const vatError = validateVat(net, gross, defaultVatRate);
    if (vatError) {
      anomalies.push(vatError);
    }
  }

  return anomalies;
}
