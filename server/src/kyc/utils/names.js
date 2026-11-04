/**
 * Normalize an applicant or business person name by removing common honorifics and business prefixes.
 * @param {string} name
 * @returns {string}
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .replace(/\b(mr|ms|mrs|dr|shri|smt|prop|partner|director|m\/s|llp|pvt|ltd)\b[.]?/gi, '')
    .replace(/\(prop\.[^)]+\)/gi, '')
    .replace(/[()[\]{}.,\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Calculate Jaro similarity between two strings.
 */
function jaroSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  return (
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3.0
  );
}

/**
 * Calculate Jaro-Winkler similarity with prefix bonus.
 * @param {string} str1
 * @param {string} str2
 * @returns {number} Value between 0.0 and 1.0
 */
export function jaroWinklerSimilarity(str1, str2) {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const jaro = jaroSimilarity(s1, s2);

  // Common prefix length up to 4 chars
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const p = 0.1; // scaling factor
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Compare two names and determine if they match within the regulated threshold (>= 0.85).
 * @param {string} name1
 * @param {string} name2
 * @param {number} [threshold=0.85]
 * @returns {{ match: boolean, score: number, name1Normalized: string, name2Normalized: string }}
 */
export function compareNames(name1, name2, threshold = 0.85) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  // Direct word containment check (e.g. "Joseph Shah" vs "Shah Joseph")
  const words1 = norm1.split(' ').sort().join(' ');
  const words2 = norm2.split(' ').sort().join(' ');
  if (words1 === words2 && words1.length > 0) {
    return { match: true, score: 1.0, name1Normalized: norm1, name2Normalized: norm2 };
  }

  const score = jaroWinklerSimilarity(norm1, norm2);
  return {
    match: score >= threshold,
    score: Math.round(score * 1000) / 1000,
    name1Normalized: norm1,
    name2Normalized: norm2,
  };
}
