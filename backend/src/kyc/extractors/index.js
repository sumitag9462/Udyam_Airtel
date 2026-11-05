import { validateGstinChecksum } from '../../utils/gstin.js';
import { getBestGstinCandidate, generateGstinCandidates } from '../utils/gstinOcr.js';

/**
 * Clean OCR lines by trimming whitespace and punctuation noise.
 */
function getCleanLines(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Extract structured fields from a GST Certificate OCR text.
 * @param {string} text
 * @returns {object}
 */
export function extractGstCert(text) {
  const result = {
    documentType: 'gst_certificate',
    rawText: text,
    gstin: null,
    legalName: null,
    tradeName: null,
    constitution: null,
    address: null,
    dateOfLiability: null,
    isValidFormat: false,
  };

  const lines = getCleanLines(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // GSTIN extraction
    if (!result.gstin) {
      const gstinMatch = line.match(/\b([0-9]{2}[A-Z0-9]{13})\b/i);
      if (gstinMatch) {
        const rawCandidate = gstinMatch[1].toUpperCase();
        result.rawGstin = rawCandidate;
        const bestCandidate = getBestGstinCandidate(rawCandidate);
        result.gstin = bestCandidate || rawCandidate;
        result.gstinCandidates = generateGstinCandidates(rawCandidate);
        result.isValidFormat = validateGstinChecksum(result.gstin);
      }
    }

    // Legal name
    if (/legal name/i.test(line)) {
      const val = line.replace(/.*legal name[:\s]*/i, '').trim();
      result.legalName = val || lines[i + 1] || null;
    }

    // Trade name
    if (/trade name/i.test(line)) {
      const val = line.replace(/.*trade name[:\s]*/i, '').trim();
      result.tradeName = val || lines[i + 1] || null;
    }

    // Constitution
    if (/constitution/i.test(line)) {
      const val = line.replace(/.*constitution[:\s]*/i, '').trim();
      result.constitution = val || lines[i + 1] || null;
    }

    // Address
    if (/address of principal|place of business/i.test(line)) {
      const rest = line.replace(/.*(?:address of principal|place of business)[:\s]*/i, '').trim();
      const next1 = lines[i + 1] || '';
      const next2 = lines[i + 2] || '';
      result.address = `${rest} ${next1} ${next2}`.trim();
    }

    // Date
    if (/date of liability|registration date/i.test(line)) {
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/) || line.match(/\d{2}[-/]\d{2}[-/]\d{4}/);
      if (dateMatch) {
        result.dateOfLiability = dateMatch[0];
      }
    }
  }

  return result;
}

/**
 * Extract structured fields from a Udyam Registration Certificate OCR text.
 * @param {string} text
 * @returns {object}
 */
export function extractUdyamCert(text) {
  const result = {
    documentType: 'udyam_certificate',
    rawText: text,
    udyamNumber: null,
    enterpriseName: null,
    majorActivity: null,
    city: null,
    state: null,
    dateOfRegistration: null,
    isValidFormat: false,
  };

  const lines = getCleanLines(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Udyam Number
    if (!result.udyamNumber) {
      const udyamMatch = line.match(/\b(UDYAM-[A-Z]{2}-00-[0-9]{7})\b/i);
      if (udyamMatch) {
        result.udyamNumber = udyamMatch[1].toUpperCase();
        result.isValidFormat = true;
      }
    }

    // Enterprise Name
    if (/enterprise name/i.test(line)) {
      const val = line.replace(/.*enterprise name[:\s]*/i, '').trim();
      result.enterpriseName = val || lines[i + 1] || null;
    }

    // Major Activity
    if (/major activity/i.test(line)) {
      const val = line.replace(/.*major activity[:\s]*/i, '').trim();
      result.majorActivity = val || null;
    }

    // City
    if (/\bcity\b/i.test(line)) {
      const val = line.replace(/.*city[:\s]*/i, '').trim();
      result.city = val || null;
    }

    // State
    if (/\bstate\b/i.test(line)) {
      const val = line.replace(/.*state[:\s]*/i, '').trim();
      result.state = val || null;
    }

    // Date of Registration
    if (/date of registration/i.test(line)) {
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/) || line.match(/\d{2}[-/]\d{2}[-/]\d{4}/);
      if (dateMatch) {
        result.dateOfRegistration = dateMatch[0];
      }
    }
  }

  return result;
}

/**
 * Extract structured fields from an Authorised Signatory ID OCR text.
 * @param {string} text
 * @returns {object}
 */
export function extractSignatoryId(text) {
  const result = {
    documentType: 'signatory_id',
    rawText: text,
    signatoryName: null,
    designation: null,
    businessName: null,
    idNumber: null,
    validTill: null,
  };

  const lines = getCleanLines(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^name$/i.test(line) && lines[i + 1]) {
      result.signatoryName = lines[i + 1].trim();
    } else if (/name[:\s]+/i.test(line) && !result.signatoryName) {
      result.signatoryName = line.replace(/name[:\s]*/i, '').trim();
    }

    if (/^designation$/i.test(line) && lines[i + 1]) {
      result.designation = lines[i + 1].trim();
    }

    if (/for business/i.test(line) && lines[i + 1]) {
      result.businessName = lines[i + 1].trim();
    }

    if (/id no/i.test(line)) {
      const idMatch = line.match(/\b(SYN-ID-[0-9]{6}|[A-Z]{5}[0-9]{4}[A-Z]|[0-9]{12})\b/i);
      if (idMatch) {
        result.idNumber = idMatch[1];
      } else if (lines[i + 1]) {
        result.idNumber = lines[i + 1].trim();
      }
    }

    if (/valid till/i.test(line)) {
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/) || (lines[i + 1] && lines[i + 1].match(/\d{4}-\d{2}-\d{2}/));
      if (dateMatch) {
        result.validTill = dateMatch[0];
      }
    }
  }

  return result;
}

/**
 * Extract structured fields from an Address Proof / Utility Bill OCR text.
 * @param {string} text
 * @returns {object}
 */
export function extractAddressProof(text) {
  const result = {
    documentType: 'address_proof',
    rawText: text,
    billedTo: null,
    consumerNo: null,
    supplyAddress: null,
    billDate: null,
    amountDue: null,
  };

  const lines = getCleanLines(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/consumer no/i.test(line)) {
      const match = line.match(/\d{10}/);
      if (match) result.consumerNo = match[0];
    }

    if (/billed to/i.test(line)) {
      result.billedTo = line.replace(/billed to[:\s]*/i, '').trim();
    }

    if (/supply address/i.test(line)) {
      const rest = line.replace(/supply address[:\s]*/i, '').trim();
      const next1 = lines[i + 1] || '';
      const next2 = lines[i + 2] || '';
      result.supplyAddress = `${rest} ${next1} ${next2}`.trim();
    }

    if (/bill date/i.test(line)) {
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/) || line.match(/\d{2}[-/]\d{2}[-/]\d{4}/);
      if (dateMatch) {
        result.billDate = dateMatch[0];
      }
    }

    if (/amount due/i.test(line)) {
      const amtMatch = line.match(/[\d,]+(\.\d+)?/);
      if (amtMatch) result.amountDue = amtMatch[0];
    }
  }

  return result;
}
