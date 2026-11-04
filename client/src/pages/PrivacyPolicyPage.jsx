import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📜</span>
              <span className="text-xs font-bold text-airtel-red uppercase tracking-wider">
                India DPDP Act 2023 Compliance Note
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Privacy Policy & Data Protection Notice
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Effective Date: July 2026 · Digital Personal Data Protection Act, 2023 (DPDP Act) · Project Udyam Digital
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Data Fiduciary & Contact Details</h2>
              <p>
                Bharti Airtel Limited (&ldquo;Airtel Business&rdquo;) acts as the Data Fiduciary for personal data collected through Udyam One. For any privacy queries, consent modifications, or grievances, our Data Protection Officer (DPO) and Grievance Nodal Officer can be reached via our{' '}
                <Link to="/grievance" className="text-airtel-red underline font-medium">
                  DPDP Grievance Redressal Portal
                </Link>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Specific Purpose of Data Collection</h2>
              <p>
                In strict compliance with the principle of <em>Purpose Limitation</em> (Section 6, DPDP Act 2023), personal data is processed solely for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Evaluating enterprise business connectivity requirements and calculating catalogue-backed quotes.</li>
                <li>Conducting mandatory Customer Acquisition Form (CAF) & Smart KYC regulatory checks as mandated by the Department of Telecommunications (DoT).</li>
                <li>Dispatching optical network engineers and provisioning physical fiber connectivity to customer premises.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">3. Data Minimisation Guarantee</h2>
              <p>
                We do not request or store arbitrary personal data. We collect strictly:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Business profile details (Enterprise name, city tier, site count, employee band).</li>
                <li>Signatory mobile number (masked, salted-hash stored; OTP verified).</li>
                <li>Government identity proofs (GSTIN/Udyam certificates, Signatory PAN/Aadhaar proof of identity, utility/establishment address proof).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">4. Cryptographic Storage & PII Masking</h2>
              <p>
                All document files uploaded for verification are immediately encrypted at rest using <strong>AES-256-GCM</strong> authenticated encryption with unique per-file initialization vectors. Server logs, error reports, and analytics completely redact raw PII (displaying only the last 4 digits of phone numbers and masked GSTINs).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">5. Rights of the Data Principal</h2>
              <p>
                Under Chapter III of the DPDP Act 2023, you enjoy statutory rights that you can exercise anytime via your{' '}
                <Link to="/account/privacy" className="text-airtel-red underline font-medium">
                  Privacy Centre
                </Link>:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right to Withdraw Consent:</strong> Revoke digital consent anytime. Verification ceases immediately.</li>
                <li><strong>Right to Data Portability:</strong> Export all personal records in a structured JSON bundle.</li>
                <li><strong>Right to Correction & Erasure:</strong> Request correction or deletion of personal data.</li>
                <li><strong>Right to Grievance Redressal:</strong> Guaranteed formal investigation within statutory timelines.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">6. Statutory Retention Policy</h2>
              <p>
                Data is retained only as long as necessary. Unclosed leads and rejected applications are expunged within 30 days. Activated subscriber CAF and CDR records are retained in compliance with statutory DoT/TRAI licensing guidelines.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/account/privacy"
              className="px-5 py-2.5 bg-airtel-red text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-xs transition-colors"
            >
              Open Privacy Centre
            </Link>
            <Link
              to="/grievance"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Lodge DPDP Grievance
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
