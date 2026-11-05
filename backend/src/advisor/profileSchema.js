import { z } from 'zod';
import { SEGMENTS } from '../config/constants.js';

export const advisorProfileSchema = z.object({
  businessName: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  segment: z.enum(SEGMENTS).optional(),
  employeeCount: z.coerce.number().int().min(1).optional(),
  numSites: z.coerce.number().int().min(1).optional(),
  city: z.string().trim().optional(),
  cityTier: z.coerce.number().int().min(1).max(2).optional(),
  currentInternet: z.string().trim().optional(),
  currentProvider: z.string().trim().optional(),
  monthlyTelecomSpend: z.coerce.number().optional(),
  budgetMonthly: z.coerce.number().optional().nullable(),
  mustHaves: z.array(z.string()).default([]),
  mobileLines: z.coerce.number().int().min(0).optional(),
  devices: z.coerce.number().int().min(0).optional(),
  cameras: z.coerce.number().int().min(0).optional(),
  hasGstin: z.coerce.boolean().optional(),
  gstin: z.string().trim().optional(),
  hasUdyam: z.coerce.boolean().optional(),
  udyamNumber: z.string().trim().optional(),
  language: z.string().default('en'),
  contactName: z.string().trim().optional(),
  contactRole: z.string().trim().optional(),
  needSpeed: z.coerce.boolean().optional(),
  needHighSpeed: z.coerce.boolean().optional(),
});
