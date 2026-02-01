/**
 * KNN-style opponent matching for outfit battles.
 * Matches by gender (0/1/2), age (normalized by 100), and style preference (one-hot).
 * Style has higher weight than gender and age (weighted Euclidean distance).
 */

// Same order as onboarding FASHION_PREFERENCES
const STYLE_OPTIONS = [
  'Streetwear', 'Minimalist', 'Vintage', 'Sporty', 'Techwear',
  'Bohemian', 'Classic', 'Casual', 'Formal', 'Preppy', 'Grunge',
  'Y2K', 'Coastal', 'Urban', 'High Fashion', 'Athleisure',
  'Romantic', 'Edgy', 'Artsy', 'Sustainable',
];

const GENDER_MAP = { male: 0, female: 1, other: 2 };

const WEIGHT_GENDER = 0.5;
const WEIGHT_AGE = 0.5;
const WEIGHT_STYLE = 2.0;

/**
 * Build feature vector for one user: [genderEnc, ageNorm, ...styleOneHot].
 * @param {{ gender?: string, age?: number, preferences?: string[] }} user
 * @returns {number[]}
 */
function buildFeatureVector(user) {
  const g = (user.gender || '').toLowerCase().trim();
  const genderEnc = GENDER_MAP[g] ?? GENDER_MAP.other;
  const ageNorm = Math.min(1, Math.max(0, (user.age ?? 25) / 100));
  const styleOneHot = STYLE_OPTIONS.map(style => {
    const prefs = user.preferences || [];
    const found = prefs.some(p => String(p).trim().toLowerCase() === style.toLowerCase());
    return found ? 1 : 0;
  });
  return [genderEnc, ageNorm, ...styleOneHot];
}

/**
 * Weights array: [WEIGHT_GENDER, WEIGHT_AGE, ...WEIGHT_STYLE repeated].
 */
function getWeights() {
  return [WEIGHT_GENDER, WEIGHT_AGE, ...STYLE_OPTIONS.map(() => WEIGHT_STYLE)];
}

/**
 * Weighted Euclidean distance between two feature vectors.
 */
function weightedEuclidean(a, b, weights) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    const w = weights[i] ?? 1;
    sum += w * w * d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Find up to k nearest opponent user ids (excluding currentUser id).
 * Users are plain objects with _id, gender, age, preferences.
 * @param {string} currentUserId - current user's _id (string or ObjectId)
 * @param {Array<{ _id: any, gender?: string, age?: number, preferences?: string[] }>} users - all users (e.g. from User.find().lean())
 * @param {number} k - number of opponents to return (default 1)
 * @returns {string[]} opponent user ids (up to k)
 */
function matchOpponents(currentUserId, users, k = 1) {
  const currentIdStr = String(currentUserId);
  const others = users.filter(u => String(u._id) !== currentIdStr);
  if (others.length === 0 || k <= 0) return [];

  const weights = getWeights();
  const currentUser = users.find(u => String(u._id) === currentIdStr);
  const currentVec = buildFeatureVector(currentUser || {});

  const withDistance = others.map(u => {
    const vec = buildFeatureVector(u);
    const dist = weightedEuclidean(currentVec, vec, weights);
    return { userId: String(u._id), distance: dist };
  });
  withDistance.sort((a, b) => a.distance - b.distance);
  return withDistance.slice(0, k).map(x => x.userId);
}

module.exports = {
  matchOpponents,
  buildFeatureVector,
  getWeights,
  STYLE_OPTIONS,
  GENDER_MAP,
};
