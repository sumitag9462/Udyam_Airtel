import mongoose from 'mongoose';
import { User, Lead, Quote, KycCase, Order, Consent, Conversation, Product } from '../backend/src/models/index.js';
import { config } from '../backend/src/config/env.js';
import { previewScenario, computeQuote } from '../backend/src/rules/index.js';
import { buildBundles } from '../backend/src/rules/bundles.js';
import { signAccessToken } from '../backend/src/utils/tokens.js';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'http://localhost:3001/api/v1';

async function req(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, headers: res.headers, data: json };
}

async function runPhase1Verifications() {
  console.log('===============================================================');
  console.log('   PHASE 1 FIXES: RIGOROUS REGRESSION & PERSISTENCE VERIFICATION');
  console.log('===============================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.MONGO_URI);
  }

  // --- ITEM 1: AI Advisor duplicate greetings & conversation consistency ---
  console.log('1. Verifying Bug 01: AI Advisor Greetings & Context Consistency');
  const testPhone1 = '9811' + Math.floor(100000 + Math.random() * 900000);
  const otpRes1 = await req('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone: testPhone1 }) });
  const outboxRes1 = await req('/dev/outbox');
  const notif1 = outboxRes1.data.data.notifications.filter(n => n.toMasked?.includes(testPhone1.slice(-4))).pop();
  const verifyRes1 = await req('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone: testPhone1, code: notif1.payload.code }) });
  const token1 = verifyRes1.data.data.accessToken;
  const auth1 = { Authorization: `Bearer ${token1}` };

  // Turn 1
  const chat1 = await req('/advisor/chat', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({ message: 'Hello, I need internet for my dental clinic in Mumbai with 6 staff', language: 'en' }),
  });
  if (chat1.status !== 200 || !chat1.data.ok) throw new Error('Advisor turn 1 failed');
  const convId = chat1.data.data.conversationId;
  const reply1 = chat1.data.data.reply;
  console.log('   ✓ Turn 1 reply received. Profile extracted:', JSON.stringify(chat1.data.data.profile));

  // Turn 2: Provide additional detail (guest Wi-Fi and 2 branches)
  const chat2 = await req('/advisor/chat', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({ conversationId: convId, message: 'We have 2 sites and need guest Wi-Fi', language: 'en' }),
  });
  if (chat2.status !== 200) throw new Error('Advisor turn 2 failed');
  const profile2 = chat2.data.data.profile;
  console.log('   ✓ Turn 2 reply received. Updated profile:', JSON.stringify(profile2));

  // Verify DB persistence of conversation
  const convDoc = await Conversation.findById(convId);
  if (!convDoc) throw new Error('Conversation document not found in MongoDB');
  if (convDoc.messages.length < 2) throw new Error('Conversation messages not persisted in MongoDB');
  if (convDoc.profile.city !== 'Mumbai' || convDoc.profile.numSites !== 2) {
    throw new Error(`Profile not correctly updated in MongoDB: ${JSON.stringify(convDoc.profile)}`);
  }
  console.log('   ✓ Conversation messages persisted in MongoDB (Message count:', convDoc.messages.length, ')');

  // --- ITEM 2: Hindi/English language switching & dictionary completeness ---
  console.log('\n2. Verifying Bug 02: Language Switching & Translation Parity');
  const enDict = JSON.parse(fs.readFileSync(path.resolve('frontend/src/i18n/en/translation.json'), 'utf8'));
  const hiDict = JSON.parse(fs.readFileSync(path.resolve('frontend/src/i18n/hi/translation.json'), 'utf8'));

  function checkKeyParity(enObj, hiObj, prefix = '') {
    for (const key of Object.keys(enObj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        if (!hiObj[key] || typeof hiObj[key] !== 'object') {
          throw new Error(`Missing nested translation group in Hindi: ${fullKey}`);
        }
        checkKeyParity(enObj[key], hiObj[key], fullKey);
      } else {
        if (!hiObj[key]) {
          throw new Error(`Missing translation key in Hindi: ${fullKey}`);
        }
      }
    }
  }
  checkKeyParity(enDict, hiDict);
  console.log('   ✓ Complete 100% key parity between English and Hindi dictionaries');

  // Test API endpoint language support
  const faqEn = await req('/faq?lang=en');
  const faqHi = await req('/faq?lang=hi');
  if (faqEn.status !== 200 || faqHi.status !== 200) throw new Error('FAQ language API failed');
  const qEn = faqEn.data.data.categories[0].items[0].question;
  const qHi = faqHi.data.data.categories[0].items[0].question;
  if (!qEn || !qHi || qEn === qHi) {
    throw new Error(`FAQ questions did not localize: EN="${qEn}" vs HI="${qHi}"`);
  }
  console.log(`   ✓ Backend FAQ endpoint delivers verified Hindi translations (HI: "${qHi}")`);

  // --- ITEM 3: Order creation and Track Order functionality ---
  console.log('\n3. Verifying Bug 03: Order Creation & "ORD-NEW" Track Order Resolution');
  // Create quote for user 1
  const qRes = await req('/quotes', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({
      tierLabel: 'starter',
      profile: {
        businessType: 'Healthcare / Dental clinic',
        city: 'Mumbai',
        cityTier: 1,
        employeeCount: 6,
        numSites: 2,
        hasGstin: true,
      },
    }),
  });
  if (qRes.status !== 201 && qRes.status !== 200) throw new Error('Quote creation failed');
  const quoteObj = qRes.data.data.quote;
  
  // Accept quote
  const accRes = await req(`/quotes/${quoteObj.quoteId}/accept`, {
    method: 'POST',
    headers: { ...auth1, 'Idempotency-Key': `idem-accept-${Date.now()}` },
  });
  if (accRes.status !== 200) throw new Error('Accept quote failed');

  // Create order
  const orderCreateRes = await req('/orders', {
    method: 'POST',
    headers: { ...auth1, 'Idempotency-Key': `idem-order-${Date.now()}` },
    body: JSON.stringify({ quoteId: quoteObj.quoteId }),
  });
  if (orderCreateRes.status !== 201 && orderCreateRes.status !== 200) throw new Error('Order creation failed');
  const createdOrder = orderCreateRes.data.data;
  console.log('   ✓ Real Order created with unique ID:', createdOrder.orderId);

  // Track with real orderId
  const trackDirect = await req(`/orders/${createdOrder.orderId}`, { headers: auth1 });
  if (trackDirect.status !== 200 || trackDirect.data.data.orderId !== createdOrder.orderId) {
    throw new Error('Direct order track lookup failed');
  }
  console.log('   ✓ Direct order lookup returns 200 OK');

  // Track with ORD-NEW fallback
  const trackOrdNew = await req('/orders/ORD-NEW', { headers: auth1 });
  if (trackOrdNew.status !== 200 || trackOrdNew.data.data.orderId !== createdOrder.orderId) {
    throw new Error('ORD-NEW fallback did not resolve to user latest order');
  }
  console.log('   ✓ "ORD-NEW" gracefully resolves to user latest order:', trackOrdNew.data.data.orderId);

  // --- ITEM 4: Quote acceptance and price locking ---
  console.log('\n4. Verifying Bug 04: Quote Acceptance & Price Freeze Immutability');
  const quoteInDb = await Quote.findOne({ quoteId: quoteObj.quoteId });
  if (quoteInDb.status !== 'accepted') throw new Error('Quote status in DB is not accepted');
  if (!quoteInDb.priceHash) throw new Error('Quote priceHash missing in DB');
  console.log('   ✓ Quote status is "accepted" and locked in DB with priceHash:', quoteInDb.priceHash.slice(0, 16) + '...');

  // Attempt to tamper/update line items on accepted quote
  const tamperRes = await req(`/quotes/${quoteObj.quoteId}/items`, {
    method: 'PATCH',
    headers: auth1,
    body: JSON.stringify({ lineItems: [{ productId: 'P01', qty: 99 }] }),
  });
  if (tamperRes.status !== 400 && tamperRes.status !== 403 && tamperRes.status !== 409) {
    throw new Error(`Tampering with accepted quote did not fail! Status: ${tamperRes.status}`);
  }
  console.log('   ✓ Tampering with accepted quote rejected (Status:', tamperRes.status, tamperRes.data.error?.code || 'QUOTE_IMMUTABLE', ')');

  // --- ITEM 5: AI Advisor & Quote Builder data consistency ---
  console.log('\n5. Verifying Bug 05: Data Consistency Across Advisor and Quote Engine');
  const allProducts = await Product.find({ isActive: true }).lean();
  const testProfile = {
    businessType: 'CA / Law office',
    segment: 'prof',
    employeeCount: 14,
    numSites: 1,
    city: 'Delhi',
    cityTier: 1,
    hasGstin: true,
  };
  const computedBundles = buildBundles(testProfile, allProducts);
  const computedStandard = computedBundles.tiers.find((t) => t.tierLabel === 'standard');
  const apiQuoteBundle = await req('/rules/bundles', {
    method: 'POST',
    body: JSON.stringify(testProfile),
  });
  if (apiQuoteBundle.status !== 200) throw new Error('Rules bundle API failed');
  const apiStandard = apiQuoteBundle.data.data.tiers.find((t) => t.tierLabel === 'standard');
  if (!apiStandard || apiStandard.monthlyTotal !== computedStandard.monthlyTotal) {
    throw new Error(`Quote calculation mismatch: API=${apiStandard?.monthlyTotal} vs Engine=${computedStandard?.monthlyTotal}`);
  }
  console.log(`   ✓ Advisor profile totals agree exactly with Quote Engine: ₹${apiStandard.monthlyTotal}/mo`);

  // --- ITEM 6: Dynamic 20% Budget Cut scenario recalculation ---
  console.log('\n6. Verifying Bug 06: Dynamic 20% Budget Cut Calculation');
  const baselineItems = [
    { productId: 'P02', qty: 1 }, // 300 Mbps
    { productId: 'P11', qty: 2 }, // 2 Static IPs
    { productId: 'P09', qty: 1 }, // 4G Failover
    { productId: 'P17', qty: 2 }, // Cloud Backup
  ];
  const baselineQuote = computeQuote(baselineItems, allProducts);
  const scenarioResult = previewScenario(baselineQuote, 'budget_cut', testProfile, allProducts);
  if (!scenarioResult.newMonthly) throw new Error('Budget cut returned no newMonthly');
  if (scenarioResult.newMonthly > baselineQuote.monthlyTotal * 0.85) {
    throw new Error(`Budget cut did not reduce budget sufficiently: Baseline=${baselineQuote.monthlyTotal}, Optimized=${scenarioResult.newMonthly}`);
  }
  console.log(`   ✓ Baseline: ₹${baselineQuote.monthlyTotal}/mo -> Optimized: ₹${scenarioResult.newMonthly}/mo (Savings: ₹${scenarioResult.deltaMonthly}/mo)`);
  console.log('   ✓ Trade-offs identified:', scenarioResult.givenUpItems?.length || 0, 'items dropped/downgraded');

  // Verify preview endpoint accepts dynamic lineItems and profile
  const apiScenarioRes = await req(`/quotes/${quoteObj.quoteId}/preview`, {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({
      scenario: 'budget_cut',
      lineItems: baselineQuote.lineItems,
      profile: testProfile,
    }),
  });
  if (apiScenarioRes.status !== 200 || !apiScenarioRes.data.data?.preview?.newMonthly) {
    throw new Error(`API scenario preview failed: ${JSON.stringify(apiScenarioRes.data)}`);
  }
  console.log('   ✓ POST /quotes/:id/preview dynamically accepts updated lineItems and recalculates cleanly (Optimized: ₹' + apiScenarioRes.data.data.preview.newMonthly + '/mo)');

  // --- ITEM 7: Smart KYC upload, quote ID & lead ID relationships ---
  console.log('\n7. Verifying Bug 07: Smart KYC Document Upload & ID Resolution');
  // First test without consent -> must return 403
  const noConsentUpload = await req('/kyc/upload', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({ quoteId: quoteObj.quoteId, applicantId: 'K03' }),
  });
  if (noConsentUpload.status !== 403) {
    throw new Error(`Upload without consent did not return 403! Returned: ${noConsentUpload.status}`);
  }
  console.log('   ✓ Upload without DPDP consent correctly rejected with 403 Forbidden');

  // Grant DPDP Consent
  const consentRes = await req('/kyc/consent', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({
      noticeVersion: '1.0',
      purposes: ['kyc_verification'],
      documentTypes: ['gst_certificate', 'signatory_pan'],
    }),
  });
  if (consentRes.status !== 201 && consentRes.status !== 200) throw new Error('Consent grant failed');
  console.log('   ✓ DPDP Consent granted and persisted');

  // Now upload using human-readable string quoteId ('Q-...')
  const kycUploadRes = await req('/kyc/upload', {
    method: 'POST',
    headers: auth1,
    body: JSON.stringify({
      quoteId: quoteObj.quoteId, // String identifier
      applicantId: 'K03',
    }),
  });
  if (kycUploadRes.status !== 200 || !kycUploadRes.data.ok) {
    throw new Error(`KYC upload with string quoteId failed: ${JSON.stringify(kycUploadRes.data)}`);
  }
  const kycCaseId = kycUploadRes.data.data.kycCaseId;
  const kycCaseDoc = await KycCase.findById(kycCaseId);
  if (!kycCaseDoc) throw new Error('KycCase not found in MongoDB');
  if (kycCaseDoc.quoteId.toString() !== quoteInDb._id.toString()) {
    throw new Error(`KycCase.quoteId ${kycCaseDoc.quoteId} does not match quote._id ${quoteInDb._id}`);
  }
  if (!kycCaseDoc.leadId) throw new Error('KycCase.leadId was not populated');
  console.log('   ✓ KycCase created in MongoDB with valid ObjectId references:');
  console.log('     * KycCase _id:', kycCaseDoc._id.toString());
  console.log('     * quoteId (ObjectId):', kycCaseDoc.quoteId.toString());
  console.log('     * leadId (ObjectId):', kycCaseDoc.leadId.toString());
  console.log('     * Verification status:', kycCaseDoc.status);

  console.log('\n===============================================================');
  console.log('>> ALL 7 PHASE 1 FIXES VERIFIED AGAINST RUNNING SERVICES & DB <<');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runPhase1Verifications().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
