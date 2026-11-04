import {
  maskGstin,
  maskUdyam,
  maskPhone,
  maskIdNumber,
  phoneLast4,
  maskEmail,
} from '../../src/utils/mask.js';

describe('PII Masking Utilities', () => {
  test('maskGstin shows only last 4 characters', () => {
    expect(maskGstin('07AAAAA0000A1Z5')).toBe('***********A1Z5');
    expect(maskGstin('')).toBe('');
    expect(maskGstin(null)).toBe('');
    expect(maskGstin('1234')).toBe('1234');
  });

  test('maskUdyam shows only last 4 characters', () => {
    expect(maskUdyam('UDYAM-MH-00-1234567')).toBe('***************4567');
    expect(maskUdyam('')).toBe('');
    expect(maskUdyam(null)).toBe('');
  });

  test('maskPhone shows only last 4 digits', () => {
    expect(maskPhone('9876543210')).toBe('******3210');
    expect(maskPhone('+91 98765 43210')).toBe('********3210');
    expect(maskPhone('')).toBe('');
  });

  test('phoneLast4 extracts only the last 4 digits', () => {
    expect(phoneLast4('+91-9876543210')).toBe('3210');
    expect(phoneLast4('9876543210')).toBe('3210');
    expect(phoneLast4('')).toBe('');
  });

  test('maskIdNumber shows only last 4 characters', () => {
    expect(maskIdNumber('ABCD1234EF')).toBe('******34EF');
    expect(maskIdNumber('')).toBe('');
  });

  test('maskEmail preserves first 2 chars and domain', () => {
    expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null)).toBe('');
  });
});
