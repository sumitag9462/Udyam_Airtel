import { Grievance } from '../models/index.js';
import { maskPhone } from '../utils/mask.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import crypto from 'crypto';

const grievanceSchema = z.object({
  category: z.enum(['consent_withdrawal', 'data_correction', 'erasure', 'service_delay', 'billing', 'other']),
  details: z.string().min(10, 'Please describe your grievance in detail').max(1000),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

const FAQ_DATA = [
  {
    category: 'general',
    categoryName: {
      en: 'About Udyam One',
      hi: 'उद्यम वन के बारे में',
    },
    items: [
      {
        question: {
          en: 'What is Udyam One?',
          hi: 'उद्यम वन क्या है?',
        },
        answer: {
          en: 'Udyam One is Airtel Business\'s regulated digital onboarding platform for Indian small and medium enterprises. It allows you to explore connectivity, get transparent monthly quotes, complete paperless Smart KYC, and track fiber delivery with real-time telemetry.',
          hi: 'उद्यम वन भारतीय छोटे और मध्यम व्यवसायों के लिए एयरटेल बिजनेस का डिजिटल ऑनबोर्डिंग प्लेटफॉर्म है। यह आपको कनेक्टिविटी खोजने, पारदर्शी मासिक कोट प्राप्त करने, पेपरलेस स्मार्ट केवाईसी पूरा करने और रियल-टाइम टेलीमेट्री के साथ डिलीवरी ट्रैक करने की सुविधा देता है।',
        },
      },
      {
        question: {
          en: 'Who is eligible to apply?',
          hi: 'आवेदन करने के लिए कौन पात्र है?',
        },
        answer: {
          en: 'Proprietorships, partnerships, LLPs, private limited companies, and individual professionals across Tier 1 and Tier 2 cities in India can apply.',
          hi: 'भारत के टियर 1 और टियर 2 शहरों में प्रोप्राइटरशिप, पार्टनरशिप, एलएलपी, प्राइवेट लिमिटेड कंपनियां और व्यक्तिगत पेशेवर आवेदन कर सकते हैं।',
        },
      },
    ],
  },
  {
    category: 'eligibility',
    categoryName: {
      en: 'Eligibility & GSTIN',
      hi: 'पात्रता और जीएसटी',
    },
    items: [
      {
        question: {
          en: 'Do I need a GSTIN to get Airtel Business connectivity?',
          hi: 'क्या एयरटेल बिजनेस कनेक्टिविटी के लिए जीएसटी जरूरी है?',
        },
        answer: {
          en: 'No! If your enterprise does not have a GSTIN, you are eligible for Airtel 5G Business AirFiber (Plug & Play) with basic signatory ID and address proof. Dedicated primary leased lines require active GSTIN.',
          hi: 'नहीं! यदि आपके पास जीएसटी नहीं है, तो आप बुनियादी पहचान और पते के प्रमाण के साथ एयरटेल 5G बिजनेस एयरफ़ाइबर के पात्र हैं। लीज्ड लाइन के लिए सक्रिय जीएसटी अनिवार्य है।',
        },
      },
      {
        question: {
          en: 'Is an Udyam registration certificate mandatory?',
          hi: 'क्या उद्यम पंजीकरण प्रमाण पत्र अनिवार्य है?',
        },
        answer: {
          en: 'Udyam registration is optional. If you have an Udyam number, entering it unlocks MSME priority service and fast-track provisioning.',
          hi: 'उद्यम पंजीकरण वैकल्पिक है। यदि आपके पास उद्यम नंबर है, तो यह एमएसएमई प्राथमिकता सेवा और त्वरित प्रक्रिया की सुविधा देता है।',
        },
      },
    ],
  },
  {
    category: 'pricing',
    categoryName: {
      en: 'Transparent Pricing',
      hi: 'पारदर्शी मूल्य निर्धारण',
    },
    items: [
      {
        question: {
          en: 'Are there hidden charges or unexpected setup fees?',
          hi: 'क्या कोई छिपे हुए शुल्क या अप्रत्याशित सेटअप शुल्क हैं?',
        },
        answer: {
          en: 'None. Every quote is computed by our deterministic rules engine directly from Airtel\'s verified catalogue. Prices are locked upon acceptance with zero drift guaranteed.',
          hi: 'बिल्कुल नहीं। प्रत्येक कोट सीधे एयरटेल के सत्यापित कैटलॉग से गणना किया जाता है। स्वीकृति के बाद दरें पूरी तरह लॉक रहती हैं।',
        },
      },
    ],
  },
  {
    category: 'kyc',
    categoryName: {
      en: 'Smart KYC & Privacy',
      hi: 'स्मार्ट केवाईसी और गोपनीयता',
    },
    items: [
      {
        question: {
          en: 'How are my uploaded KYC documents protected?',
          hi: 'मेरे अपलोड किए गए केवाईसी दस्तावेज़ कैसे सुरक्षित हैं?',
        },
        answer: {
          en: 'All documents are encrypted at rest using AES-256-GCM authenticated encryption. We comply strictly with India\'s Digital Personal Data Protection Act 2023 (DPDP Act). Data is minimised and retained strictly under statutory guidelines.',
          hi: 'सभी दस्तावेज़ AES-256-GCM एन्क्रिप्शन के साथ सुरक्षित हैं। हम भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 का कड़ाई से पालन करते हैं।',
        },
      },
      {
        question: {
          en: 'Can I withdraw my consent or request data deletion?',
          hi: 'क्या मैं अपनी सहमति वापस ले सकता हूँ या डेटा हटाने का अनुरोध कर सकता हूँ?',
        },
        answer: {
          en: 'Yes. Visit the Privacy Centre in your account dashboard at any time to withdraw consent, export all your data, or submit an erasure request.',
          hi: 'हाँ। सहमति वापस लेने, अपना डेटा निर्यात करने या हटाने का अनुरोध करने के लिए अपने खाता डैशबोर्ड में गोपनीयता केंद्र पर जाएं।',
        },
      },
    ],
  },
];

/**
 * GET /api/v1/faq
 */
export async function getFaq(req, res) {
  const lang = req.query.lang === 'hi' ? 'hi' : 'en';

  const localizedFaq = FAQ_DATA.map((cat) => ({
    category: cat.category,
    categoryName: cat.categoryName[lang] || cat.categoryName.en,
    items: cat.items.map((item) => ({
      question: item.question[lang] || item.question.en,
      answer: item.answer[lang] || item.answer.en,
    })),
  }));

  res.json({
    ok: true,
    data: {
      language: lang,
      categories: localizedFaq,
      raw: FAQ_DATA,
    },
  });
}

/**
 * POST /api/v1/grievances
 */
export async function createGrievance(req, res, next) {
  try {
    const parseRes = grievanceSchema.safeParse(req.body);
    if (!parseRes.success) {
      throw new AppError('Invalid grievance submission.', 400, 'BAD_REQUEST', parseRes.error.flatten());
    }

    const { category, details, contactPhone, contactEmail } = parseRes.data;
    const ticketId = `GRV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const grievance = await Grievance.create({
      ticketId,
      userId: req.user?._id || null,
      category,
      details,
      contactPhoneMasked: contactPhone ? maskPhone(contactPhone) : null,
      contactEmail: contactEmail || null,
      status: 'received',
    });

    res.status(201).json({
      ok: true,
      data: {
        ticketId: grievance.ticketId,
        status: grievance.status,
        officerAssigned: grievance.officerAssigned,
        message: 'Your grievance has been formally registered under DPDP Act 2023. Our Nodal Officer will respond within statutory timelines.',
        createdAt: grievance.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
