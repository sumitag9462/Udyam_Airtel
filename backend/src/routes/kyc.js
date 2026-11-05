import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  createConsent,
  withdrawConsent,
  uploadKycDocuments,
  getKycCase,
  getReviewQueue,
  reviewKycCase,
} from '../controllers/kycController.js';
import { config } from '../config/env.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.UPLOAD_MAX_BYTES || 5_242_880,
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${file.mimetype}. Allowed types: image/jpeg, image/png, application/pdf`));
    }
  },
});

const kycUploadFields = upload.fields([
  { name: 'gst_certificate', maxCount: 1 },
  { name: 'udyam_certificate', maxCount: 1 },
  { name: 'signatory_id', maxCount: 1 },
  { name: 'address_proof', maxCount: 1 },
]);

// All KYC routes require authentication
router.use(requireAuth);

// Consent endpoints
router.post('/consent', requireRole('owner', 'admin'), createConsent);
router.post('/consent/withdraw', requireRole('owner', 'admin'), withdrawConsent);

// Document upload & pipeline trigger
router.post('/upload', requireRole('owner', 'admin'), kycUploadFields, uploadKycDocuments);

// Human Review Queue (Staff only: advisor, admin)
router.get('/review-queue', requireRole('advisor', 'admin'), getReviewQueue);

// Specific case details & manual decision
router.get('/cases/:id', requireRole('owner', 'advisor', 'admin'), getKycCase);
router.post('/cases/:id/review', requireRole('advisor', 'admin'), reviewKycCase);

export default router;
