export const ADVISOR_STATES = Object.freeze({
  GREETING: 'GREETING',
  BUSINESS_PROFILE: 'BUSINESS_PROFILE',
  SCALE: 'SCALE',
  CONNECTIVITY_NEEDS: 'CONNECTIVITY_NEEDS',
  REGISTRATION_STATUS: 'REGISTRATION_STATUS',
  MUST_HAVES: 'MUST_HAVES',
  BUDGET: 'BUDGET',
  RECOMMENDATION: 'RECOMMENDATION',
  REFINEMENT: 'REFINEMENT',
  HANDOFF_OR_QUOTE: 'HANDOFF_OR_QUOTE',
});

export const MAX_QUESTIONS = 6;

/**
 * Determine next conversation state based on profile completeness and question count.
 * @param {string} currentState
 * @param {object} profile
 * @param {number} questionCount
 * @returns {string} nextState
 */
export function determineNextState(currentState, profile = {}, questionCount = 0) {
  // If user requested handoff or completed quote
  if (currentState === ADVISOR_STATES.HANDOFF_OR_QUOTE) {
    return ADVISOR_STATES.HANDOFF_OR_QUOTE;
  }

  // Once at recommendation, stay in recommendation or refinement unless handoff
  if (currentState === ADVISOR_STATES.RECOMMENDATION || currentState === ADVISOR_STATES.REFINEMENT) {
    return ADVISOR_STATES.REFINEMENT;
  }

  // Non-negotiable: Max 6 questions before presenting recommendation
  if (questionCount >= MAX_QUESTIONS) {
    return ADVISOR_STATES.RECOMMENDATION;
  }

  // Progression logic based on missing profile fields
  if (!profile.businessType || !profile.city) {
    return ADVISOR_STATES.BUSINESS_PROFILE;
  }

  if (profile.employeeCount === undefined || profile.numSites === undefined) {
    return ADVISOR_STATES.SCALE;
  }

  if (profile.hasGstin === undefined) {
    return ADVISOR_STATES.REGISTRATION_STATUS;
  }

  if (!profile.currentInternet && !profile.currentProvider) {
    return ADVISOR_STATES.CONNECTIVITY_NEEDS;
  }

  if (!profile.mustHaves || profile.mustHaves.length === 0) {
    return ADVISOR_STATES.MUST_HAVES;
  }

  // If all core items collected, advance to recommendation
  return ADVISOR_STATES.RECOMMENDATION;
}

/**
 * Check if the conversation is ready to compute recommended tiers.
 * @param {object} profile
 * @param {number} questionCount
 * @returns {boolean}
 */
export function isReadyForRecommendation(profile = {}, questionCount = 0) {
  if (questionCount >= MAX_QUESTIONS) return true;
  return Boolean(
    profile.businessType &&
    profile.city &&
    profile.employeeCount !== undefined &&
    profile.numSites !== undefined
  );
}
