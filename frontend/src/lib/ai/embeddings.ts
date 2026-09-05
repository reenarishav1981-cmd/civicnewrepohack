/**
 * CivicPulse Semantic Embedding & Similarity Engine
 * Uses normalized multi-dimensional civic hazard domain embeddings + cosine similarity.
 */

// Key civic taxonomy feature dimensions
const CIVIC_FEATURE_LEXICON = [
  // Road & Infrastructure Hazards
  "pothole", "crater", "road damaged", "tarmac", "asphalt", "broken road", "surface collapsed",
  "sinkhole", "bridge crack", "divider broken", "footpath broken", "manhole open", "accident hazard",
  
  // Water & Sewage
  "water leakage", "pipe burst", "pipeline leaking", "drinking water wasted", "low pressure",
  "drainage overflow", "sewage blockage", "gutter clogged", "stagnant water", "flood water",
  "dirty water mixing", "smell foul", "sewer line",
  
  // Sanitation & Garbage
  "garbage dump", "waste pile", "trash overflowing", "debris", "dead animal", "uncollected bins",
  "littering", "plastic waste", "sanitation failure", "dumpster full",
  
  // Electrical & Streetlight
  "streetlight dark", "lamp not working", "street light blinking", "wire hanging", "electrical spark",
  "transformer blast", "open fuse box", "electric shock risk", "power cable",
  
  // Safety & High Risk Context
  "school", "hospital", "children", "students", "accident", "injured", "skid bike", "elderly",
  "highway", "crossing", "heavy traffic", "blind spot", "danger", "urgent", "critical", "emergency"
];

/**
 * Tokenize and normalize text
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Generate a dense normalized embedding vector for a civic report text
 */
export function generateCivicEmbedding(text: string): number[] {
  const normalizedText = text.toLowerCase();
  const tokens = tokenizeText(normalizedText);
  const tokenSet = new Set(tokens);

  const vector = new Array(CIVIC_FEATURE_LEXICON.length).fill(0);

  CIVIC_FEATURE_LEXICON.forEach((feature, index) => {
    const featureTokens = feature.split(" ");
    let matchScore = 0;

    // Exact phrase match
    if (normalizedText.includes(feature)) {
      matchScore += 2.0;
    }

    // Individual token overlap
    featureTokens.forEach(t => {
      if (tokenSet.has(t)) {
        matchScore += 1.0;
      }
    });

    vector[index] = matchScore;
  });

  // Normalize vector to unit length (L2 norm) for fast cosine similarity
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    // Default unit vector if no recognized words
    return vector.map(() => 1 / Math.sqrt(vector.length));
  }

  return vector.map(val => val / magnitude);
}

/**
 * Compute Cosine Similarity between two embedding vectors
 * Range: 0.0 to 1.0
 */
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Clamped between 0 and 1
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Extract matched keywords for explainability
 */
export function extractMatchedKeywords(textA: string, textB: string): string[] {
  const tokensA = new Set(tokenizeText(textA));
  const tokensB = new Set(tokenizeText(textB));
  const common = Array.from(tokensA).filter(t => tokensB.has(t));
  return common.slice(0, 5);
}
