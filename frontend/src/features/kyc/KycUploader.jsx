import { useState } from 'react';
import { uploadKycDocuments } from './api.js';

const DEMO_SPECIMENS = [
  { id: 'K03', label: 'Specimen K03 — Ganesh Woodcraft (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K01', label: 'Specimen K01 — Cancelled GSTIN (Hard Blocker / Rejected)', outcome: 'rejected' },
  { id: 'K02', label: 'Specimen K02 — Corrupted Text Tokens (Human Review)', outcome: 'requires_review' },
  { id: 'K04', label: 'Specimen K04 — Blurred GST Image (Laplacian < 50 / Review)', outcome: 'requires_review' },
  { id: 'K05', label: 'Specimen K05 — Balaji Realty LLP, No Udyam (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K06', label: 'Specimen K06 — Saffron Unisex Salon (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K07', label: 'Specimen K07 — Signatory Name Mismatch (Human Review)', outcome: 'requires_review' },
  { id: 'K08', label: 'Specimen K08 — Green Leaf Legal Associates (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K09', label: 'Specimen K09 — Kaveri Insurance Advisors (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K10', label: 'Specimen K10 — Kaveri Stays LLP (Clean / Auto-Approved)', outcome: 'auto_approved' },
  { id: 'K11', label: 'Specimen K11 — Trinity Bake House, Stale Bill > 90d (Rejected)', outcome: 'rejected' },
  { id: 'K12', label: 'Specimen K12 — Star Electronics (Clean / Auto-Approved)', outcome: 'auto_approved' },
];

export default function KycUploader({ consentId, quoteId, leadId, onUploadSuccess }) {
  const [selectedDemo, setSelectedDemo] = useState('K03');
  const [files, setFiles] = useState({
    gst_certificate: null,
    udyam_certificate: null,
    signatory_id: null,
    address_proof: null,
  });
  const [useSpecimen, setUseSpecimen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (docType, e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [docType]: e.target.files[0] }));
      setUseSpecimen(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!consentId) {
      setError('Please review and accept the DPDP consent notice before uploading documents.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgressMsg('Encrypting files at rest with AES-256-GCM...');

    try {
      const formData = new FormData();
      if (consentId) formData.append('consentId', consentId);
      if (quoteId) formData.append('quoteId', quoteId);
      const quoteMongoId = typeof window !== 'undefined' && window.sessionStorage ? sessionStorage.getItem('udyam_last_quote_mongo_id') : null;
      if (quoteMongoId) formData.append('quoteMongoId', quoteMongoId);
      const fallbackLeadId = typeof window !== 'undefined' && window.sessionStorage ? sessionStorage.getItem('udyam_last_lead_id') : null;
      const effectiveLead = leadId || fallbackLeadId;
      if (effectiveLead) formData.append('leadId', effectiveLead);

      if (useSpecimen) {
        formData.append('applicantId', selectedDemo);
      } else {
        if (!files.gst_certificate || !files.signatory_id || !files.address_proof) {
          throw new Error('GST certificate, Signatory ID, and Address Proof are required');
        }
        formData.append('gst_certificate', files.gst_certificate);
        formData.append('signatory_id', files.signatory_id);
        formData.append('address_proof', files.address_proof);
        if (files.udyam_certificate) {
          formData.append('udyam_certificate', files.udyam_certificate);
        }
      }

      setTimeout(() => setProgressMsg('Running OCR & Laplacian blur analysis...'), 400);
      setTimeout(() => setProgressMsg('Executing 19 regulated KYC verification checks...'), 800);

      const result = await uploadKycDocuments(formData);
      onUploadSuccess(result);
    } catch (err) {
      setError(err.message || 'Verification pipeline encountered an error');
    } finally {
      setUploading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Smart Document Verification</h2>
          <p className="text-sm text-gray-500">Automated extraction and multi-registry verification</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
            Mode: {useSpecimen ? 'Preloaded Benchmark Specimen' : 'Custom Upload'}
          </span>
        </div>
      </div>

      {/* Demo Specimen Quick-Select */}
      <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            Jury Demo Testbench • Ground Truth Specimens
          </span>
          <button
            type="button"
            onClick={() => setUseSpecimen(!useSpecimen)}
            className="text-xs text-red-600 hover:text-red-700 font-medium underline"
          >
            {useSpecimen ? 'Switch to manual file upload' : 'Use benchmark specimens'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Select one of the 12 verified test applicants with planted defects to run live against the rules engine:
        </p>
        <select
          value={selectedDemo}
          disabled={!useSpecimen || uploading}
          onChange={(e) => setSelectedDemo(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-medium text-gray-800 shadow-sm focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          {DEMO_SPECIMENS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Card 1: GST Certificate */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">1. GST Registration Certificate</h4>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">MANDATORY</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Form GST REG-06 showing legal entity name, GSTIN & state.</p>
          </div>
          <div>
            {useSpecimen ? (
              <div className="text-xs font-mono bg-white p-2 border border-gray-200 rounded text-gray-700">
                📄 {selectedDemo}_gst_certificate.png (Auto-loaded)
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(e) => handleFileChange('gst_certificate', e)}
                className="text-xs text-gray-600 w-full"
              />
            )}
          </div>
        </div>

        {/* Card 2: Signatory ID */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">2. Authorised Signatory ID</h4>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">MANDATORY</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Owner/Partner photo identity with last 4 digits unmasked.</p>
          </div>
          <div>
            {useSpecimen ? (
              <div className="text-xs font-mono bg-white p-2 border border-gray-200 rounded text-gray-700">
                📄 {selectedDemo}_signatory_id.png (Auto-loaded)
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(e) => handleFileChange('signatory_id', e)}
                className="text-xs text-gray-600 w-full"
              />
            )}
          </div>
        </div>

        {/* Card 3: Address Proof */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">3. Principal Address Proof</h4>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">MANDATORY</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Electricity or utility bill issued within the last 90 days.</p>
          </div>
          <div>
            {useSpecimen ? (
              <div className="text-xs font-mono bg-white p-2 border border-gray-200 rounded text-gray-700">
                📄 {selectedDemo}_address_proof.png (Auto-loaded)
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(e) => handleFileChange('address_proof', e)}
                className="text-xs text-gray-600 w-full"
              />
            )}
          </div>
        </div>

        {/* Card 4: Udyam Certificate (Optional) */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">4. Udyam MSME Certificate</h4>
              <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">OPTIONAL</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">MSME registration number for micro enterprise priority benefits.</p>
          </div>
          <div>
            {useSpecimen ? (
              <div className="text-xs font-mono bg-white p-2 border border-gray-200 rounded text-gray-700">
                {selectedDemo === 'K05' ? '⚠️ Not applicable for this applicant (K05 has no Udyam)' : `📄 ${selectedDemo}_udyam_certificate.png (Auto-loaded)`}
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(e) => handleFileChange('udyam_certificate', e)}
                className="text-xs text-gray-600 w-full"
              />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {uploading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
          <div>
            <p className="text-sm font-semibold">{progressMsg}</p>
            <p className="text-xs text-blue-700">Checking against live Mock GSTIN & Udyam Registries...</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Processing Regulated Checks...
            </>
          ) : (
            'Verify Documents Instantly →'
          )}
        </button>
      </div>
    </div>
  );
}
