import LLMProvider from './LLMProvider.js';
import { segmentOf } from '../../rules/segment.js';
import { isReadyForRecommendation, determineNextState } from '../stateMachine.js';

export default class MockProvider extends LLMProvider {
  async generateResponse(messages, _tools, context = {}) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMsg ? lastUserMsg.content.toLowerCase() : '';
    const existingProfile = context.profile || {};
    const questionCount = context.questionCount || 0;

    // Detect language
    const isHindi =
      /[\u0900-\u097F]/.test(userText) ||
      /\b(namaste|haan|nahi|chahiye|kitna|dukaan|log|jagah|hume|meri|mera|batao|kripya)\b/i.test(
        userText
      );

    const toolCalls = [];
    const extracted = {};

    // 1. Extract business type & segment
    if (!existingProfile.businessType) {
      if (/\b(law|advocate|ca|chartered|consultant|legal)\b/i.test(userText) || /लॉ\s*ऑफिस|वकील/i.test(userText)) {
        extracted.businessType = 'CA / Law office';
        extracted.segment = 'prof';
      } else if (/\b(pathology|diagnostic)\b/i.test(userText)) {
        extracted.businessType = 'Clinic / Pathology lab';
        extracted.segment = 'multi';
      } else if (/\b(dental|clinic|doctor|hospital|medical)\b/i.test(userText) || /क्लिनिक/i.test(userText)) {
        extracted.businessType = 'Dental clinic';
        extracted.segment = 'prof';
      } else if (/\b(kirana|grocery)\b/i.test(userText) || /किराना/i.test(userText)) {
        extracted.businessType = 'Kirana / Grocery';
        extracted.segment = 'micro';
      } else if (/\b(restaurant|cafe|hotel|food|dhaba)\b/i.test(userText)) {
        extracted.businessType = 'Restaurant chain';
        extracted.segment = 'multi';
      } else if (/\b(bakery)\b/i.test(userText)) {
        extracted.businessType = 'Bakery chain';
        extracted.segment = 'multi';
      } else if (/\b(diamond|polishing)\b/i.test(userText)) {
        extracted.businessType = 'Diamond polishing unit';
        extracted.segment = 'mfg';
      } else if (/\b(engineering|plant)\b/i.test(userText)) {
        extracted.businessType = 'Engineering works';
        extracted.segment = 'mfg';
      } else if (/\b(exporter)\b/i.test(userText)) {
        extracted.businessType = 'Garment exporter';
        extracted.segment = 'mfg';
      } else if (/\b(auto|parts|mfg|factory|industry|manufacturing)\b/i.test(userText)) {
        extracted.businessType = 'Auto parts / Component mfg';
        extracted.segment = 'mfg';
      } else if (/\b(coaching|institute)\b/i.test(userText)) {
        extracted.businessType = 'Coaching institute';
        extracted.segment = 'prof';
      } else if (/\b(wellness|ayurvedic)\b/i.test(userText)) {
        extracted.businessType = 'Wellness clinic';
        extracted.segment = 'prof';
      } else if (/\b(logistics|transport)\b/i.test(userText)) {
        extracted.businessType = 'Logistics office';
        extracted.segment = 'prof';
      } else if (/\b(hardware)\b/i.test(userText)) {
        extracted.businessType = 'Hardware store';
        extracted.segment = 'micro';
      } else if (/\b(pharmacy|chemist)\b/i.test(userText)) {
        extracted.businessType = 'Pharmacy retailer';
        extracted.segment = 'micro';
      } else if (/\b(silk|weaver|saree|kapde|textile)\b/i.test(userText)) {
        extracted.businessType = 'Clothing boutique';
        extracted.segment = 'micro';
      } else if (/\b(boutique|clothing|apparel|garment)\b/i.test(userText)) {
        extracted.businessType = 'Clothing boutique';
        extracted.segment = 'micro';
      } else if (/\b(software|tech|it|agency|developer)\b/i.test(userText)) {
        extracted.businessType = 'IT / Software services';
        extracted.segment = 'prof';
      } else if (/\b(retail|dukaan|shop|store)\b/i.test(userText) || /दुकान/i.test(userText)) {
        extracted.businessType = 'Retail store';
        extracted.segment = 'micro';
      }
    }

    // 2. Extract city & city tier
    const tier1Cities = ['delhi', 'mumbai', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad'];
    const tier2Cities = ['jaipur', 'lucknow', 'chandigarh', 'indore', 'nagpur', 'patna', 'bhopal', 'kochi', 'surat', 'vadodara', 'visakhapatnam', 'varanasi', 'coimbatore', 'ludhiana'];

    if (userText.includes('दिल्ली')) {
      extracted.city = 'Delhi';
      extracted.cityTier = 1;
    } else if (userText.includes('जयपुर')) {
      extracted.city = 'Jaipur';
      extracted.cityTier = 2;
    } else if (userText.includes('मुंबई')) {
      extracted.city = 'Mumbai';
      extracted.cityTier = 1;
    }

    if (!extracted.city) {
      for (const c of tier1Cities) {
        if (userText.includes(c)) {
          extracted.city = c.charAt(0).toUpperCase() + c.slice(1);
          extracted.cityTier = 1;
          break;
        }
      }
    }
    if (!extracted.city) {
      for (const c of tier2Cities) {
        if (userText.includes(c)) {
          extracted.city = c.charAt(0).toUpperCase() + c.slice(1);
          extracted.cityTier = 2;
          break;
        }
      }
    }

    const wordToNum = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, 'एक': 1, 'दो': 2 };

    // 3. Extract employee / staff count
    const staffMatch = userText.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(employees?|staff|people|team|members?|log|persons?|developers?|workers?|users?|karmachari)\b/i) ||
      userText.match(/(\d+)\s*(?:कर्मचारी|लोग|सदस्य)/i);
    if (staffMatch) {
      const raw = staffMatch[1].toLowerCase();
      extracted.employeeCount = wordToNum[raw] || parseInt(raw, 10);
    } else if (/\b(\d+)\s*user/i.test(userText)) {
      extracted.employeeCount = parseInt(userText.match(/\b(\d+)\s*user/i)[1], 10);
    }

    // 4. Extract sites / branches
    const siteMatch = userText.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:[a-z]+\s+)?(sites?|branch(?:es)?|locations?|offices?|stores?|dukaan|factories|factory|workshops?)\b/i) ||
      userText.match(/(?:एक|1)\s*(?:लॉ\s*ऑफिस|ऑफिस|स्थान|शाखा|ब्रांच)/i);
    if (siteMatch) {
      const raw = siteMatch[1]?.toLowerCase();
      extracted.numSites = wordToNum[raw] || (raw ? parseInt(raw, 10) : 1);
    } else if (/\b(single|1|one)\s*(?:[a-z]+\s+)?(location|branch|site|office|shop|dukaan|workshop|factory)\b/i.test(userText) || /1\s*hi\s*(workshop|branch|site|location)/i.test(userText) || /एक\s*(?:स्थान|शाखा|ऑफिस)/i.test(userText)) {
      extracted.numSites = 1;
    }

    // 5. Extract GSTIN status
    if (/\b(active|yes|haan|have|available|registered|number hai)\b/i.test(userText) && /gst|gstin/i.test(userText)) {
      extracted.hasGstin = true;
    } else if (/\b(no|nahi|don't have|without|none|nahi hai)\b/i.test(userText) && /gst|gstin/i.test(userText)) {
      extracted.hasGstin = false;
    } else if (/gstin/i.test(userText) && /[0-9]{2}[a-z]{5}[0-9]{4}[a-z][0-9a-z]{2}/i.test(userText)) {
      extracted.hasGstin = true;
    }

    // 6. Extract must haves
    const mustHaves = existingProfile.mustHaves ? [...existingProfile.mustHaves] : [];
    if (/cloud\s*backup|data\s*backup|storage\s*backup|1tb\s*backup|क्लाउड\s*बैकअप/i.test(userText) && !mustHaves.includes('cloud_backup')) {
      mustHaves.push('cloud_backup');
    }
    if (/(?:backup\s*(?:internet|connection|line|4g|5g|failover)|failover|redundancy|second\s*line)/i.test(userText) && !mustHaves.includes('backup_internet')) {
      mustHaves.push('backup_internet');
    } else if (/\bbackup\b/i.test(userText) && !/cloud\s*backup|क्लाउड/i.test(userText) && !mustHaves.includes('backup_internet')) {
      mustHaves.push('backup_internet');
    }
    if (/static ip|fixed ip|public ip/i.test(userText) && !mustHaves.includes('static_ip')) {
      mustHaves.push('static_ip');
    }
    if (/cctv|camera|surveillance/i.test(userText) && !mustHaves.includes('cctv')) {
      mustHaves.push('cctv');
    }
    if (/email|google|microsoft|office suite|ईमेल/i.test(userText) && !mustHaves.includes('email')) {
      mustHaves.push('email');
    }
    if (/pos|billing|retail software/i.test(userText) && !mustHaves.includes('pos')) {
      mustHaves.push('pos');
    }
    if (/security|antivirus|firewall/i.test(userText) && !mustHaves.includes('security')) {
      mustHaves.push('security');
    }
    if (mustHaves.length > (existingProfile.mustHaves?.length || 0)) {
      extracted.mustHaves = mustHaves;
    }

    // 7. Extract budget
    const budgetMatch = userText.match(/(?:budget|बजट|max(?:imum)?\s*budget|monthly\s*spend|spend)\s*(?:of|is|around|under|hai|hamara|about|upto|up\s*to)?\s*(?:rs\.?|inr|₹|रुपये)?\s*([\d,]+(?:\s*hazaar|\s*k)?)/i) ||
      userText.match(/([\d,]+)\s*(?:रुपये|rupees)?\s*(?:का\s*बजट|बजट)/i);
    if (budgetMatch) {
      let rawBudget = budgetMatch[1].replace(/,/g, '').trim().toLowerCase();
      if (rawBudget.includes('hazaar') || rawBudget.includes('k')) {
        const numPart = parseInt(rawBudget, 10);
        extracted.budgetMonthly = numPart * 1000;
      } else {
        extracted.budgetMonthly = parseInt(rawBudget, 10);
      }
    }

    // Check for human handoff request
    if (/\b(human|representative|agent|call me|executive|speak to someone)\b/i.test(userText)) {
      toolCalls.push({
        name: 'request_handoff',
        args: { reason: 'Customer requested direct human advisor support' },
      });
      return {
        text: isHindi
          ? 'Maine aapki request hamare Airtel Business Account Manager ko forward kar di hai. Wo jaldi hi aapse contact karenge.'
          : 'I have routed your request to an Airtel Business Account Manager. A representative will contact you shortly.',
        toolCalls,
      };
    }

    // Register save_profile tool call if new data found
    if (Object.keys(extracted).length > 0) {
      toolCalls.push({
        name: 'save_profile',
        args: extracted,
      });
    }

    // Merge profile to evaluate readiness
    const mergedProfile = {
      ...existingProfile,
      ...extracted,
    };
    if (mergedProfile.businessType && !mergedProfile.segment) {
      mergedProfile.segment = segmentOf(mergedProfile.businessType);
    }

    const ready = isReadyForRecommendation(mergedProfile, questionCount + 1);

    if (ready) {
      toolCalls.push({
        name: 'build_bundle',
        args: { profile: mergedProfile },
      });

      const reply = isHindi
        ? 'Aapke business ke hisaab se humne 3 plan taiyar kiye hain: Starter plan {{tier.starter.monthlyTotal}}/mahina, Standard plan {{tier.standard.monthlyTotal}}/mahina, aur Resilient plan {{tier.resilient.monthlyTotal}}/mahina. Aap inme se koi bhi plan chun kar aage badh sakte hain.'
        : 'Based on your business requirements, I have calculated 3 tailored plans: Starter at {{tier.starter.monthlyTotal}}/month, Standard at {{tier.standard.monthlyTotal}}/month, and Resilient at {{tier.resilient.monthlyTotal}}/month. You can select any tier or customize add-ons to proceed.';

      return { text: reply, toolCalls };
    }

    // Conversational progression when more details needed
    const nextState = determineNextState(context.state, mergedProfile, questionCount);

    let reply = '';
    switch (nextState) {
      case 'BUSINESS_PROFILE':
        reply = isHindi
          ? 'Namaste! Main Airtel Udyam One advisor hoon. Aapka kis cheez ka business hai aur kis city mein sthit hai?'
          : 'Welcome to Airtel Udyam One. What type of business do you operate, and in which city are you located?';
        break;

      case 'SCALE':
        reply = isHindi
          ? 'Bahut accha. Aapki team mein lagbhag kitne log (staff) hain, aur kitni alag-alag locations ya branches hain?'
          : 'Great. How many team members work at your business, and across how many office locations or branches?';
        break;

      case 'REGISTRATION_STATUS':
        reply = isHindi
          ? 'Kya aapke business ke paas Active GSTIN registration hai?'
          : 'Does your business have an Active GSTIN registration?';
        break;

      case 'CONNECTIVITY_NEEDS':
        reply = isHindi
          ? 'Abhi aap internet ke liye kya use kar rahe hain (mobile hotspot, broadband, ya leased line), aur kya aapko backup link ya high speed ki zaroorat hai?'
          : 'What type of internet connection are you currently using, and do you experience issues with speed or outages?';
        break;

      case 'MUST_HAVES':
        reply = isHindi
          ? 'Kya aapko koi vishesh suvidha jaise automated 4G/5G backup failover, static IP, CCTV, ya corporate email chahiye?'
          : 'Do you require any specific capabilities such as 4G/5G backup failover, static IP for remote access, or corporate email?';
        break;

      default:
        reply = isHindi
          ? 'Aapka target monthly budget kitna hai?'
          : 'Do you have an estimated monthly budget in mind for your connectivity?';
        break;
    }

    return { text: reply, toolCalls };
  }
}
