import logger from '../config/logger.js';
import AppError from '../utils/AppError.js';

// Regex patterns to detect unauthorized LLM output
const RAW_CURRENCY_REGEX = /(₹|Rs\.?|INR)\s*[\d,]+(\.\d+)?|\b[\d,]+(\.\d+)?\s*(rupees|inr)\b/gi;
const PRODUCT_CODE_REGEX = /\b(P0[1-9]|P1[0-9]|P2[0-5])\b/g;
const PERCENTAGE_REGEX = /\b\d+(\.\d+)?\s*%/g;

/**
 * Scan text for raw prices, product codes, or percentages typed directly by the LLM.
 * @param {string} text
 * @returns {{ valid: boolean, violations: Array<{ type: string, matched: string }> }}
 */
export function checkResponseGuard(text) {
  if (!text || typeof text !== 'string') {
    return { valid: true, violations: [] };
  }

  // Temporary strip placeholders {{...}} before inspecting raw text
  const strippedPlaceholders = text.replace(/\{\{[^}]+\}\}/g, '');

  const violations = [];

  const currencyMatches = strippedPlaceholders.match(RAW_CURRENCY_REGEX);
  if (currencyMatches) {
    for (const match of currencyMatches) {
      violations.push({ type: 'RAW_CURRENCY', matched: match });
    }
  }

  const codeMatches = strippedPlaceholders.match(PRODUCT_CODE_REGEX);
  if (codeMatches) {
    for (const match of codeMatches) {
      violations.push({ type: 'PRODUCT_CODE', matched: match });
    }
  }

  const percentMatches = strippedPlaceholders.match(PERCENTAGE_REGEX);
  if (percentMatches) {
    for (const match of percentMatches) {
      violations.push({ type: 'PERCENTAGE', matched: match });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Format a number as Indian Currency string (e.g. ₹1,745)
 */
export function formatInr(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Substitute placeholders in LLM text with authoritative rules engine values.
 * e.g. {{tier.starter.monthlyTotal}} -> ₹1,745
 * @param {string} templateText
 * @param {object} context - Must include tiers or quote
 * @returns {string}
 */
export function substitutePlaceholders(templateText, context = {}) {
  if (!templateText) return '';

  return templateText.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, path) => {
    const parts = path.split('.');

    // Handle tier lookups: tier.<starter|standard|resilient>.<field>
    if (parts[0] === 'tier' && context.tiers) {
      const tierLabel = parts[1]?.toLowerCase();
      const field = parts[2];
      const tier = context.tiers.find((t) => t.tierLabel === tierLabel);
      if (tier && tier[field] !== undefined) {
        const val = tier[field];
        if (field.toLowerCase().includes('total') || field.toLowerCase().includes('price') || field.toLowerCase().includes('saving')) {
          return formatInr(val);
        }
        return String(val);
      }
    }

    // Handle quote lookups: quote.<field>
    if (parts[0] === 'quote' && context.quote) {
      const field = parts[1];
      const val = context.quote[field];
      if (val !== undefined) {
        if (field.toLowerCase().includes('total') || field.toLowerCase().includes('price')) {
          return formatInr(val);
        }
        return String(val);
      }
    }

    // Generic object traversal
    let current = context;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in current) {
        current = current[p];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined) {
      if (typeof current === 'number') {
        return formatInr(current);
      }
      return String(current);
    }

    logger.warn({ path }, 'Placeholder in template could not be resolved from context');
    return `[${path}]`;
  });
}

/**
 * Enforce response guard on LLM text output.
 * Rejects raw currency/codes, substitutes placeholders with verified rule values.
 * @param {string} rawText
 * @param {object} context
 * @returns {string} Sanitized, verified text
 */
export function guardResponse(rawText, context = {}) {
  const check = checkResponseGuard(rawText);

  if (!check.valid) {
    logger.warn({ violations: check.violations }, 'Response guard flagged raw LLM text');
    throw new AppError(
      `Response guard violation: LLM generated unapproved factual tokens: ${check.violations
        .map((v) => `${v.type} (${v.matched})`)
        .join(', ')}`,
      500,
      'GUARD_VIOLATION',
      check.violations
    );
  }

  // Substitute all placeholders with exact numbers from rules engine
  return substitutePlaceholders(rawText, context);
}
