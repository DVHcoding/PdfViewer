/**
 * Fluentez API Service
 * Provides methods to interact with the Fluentez API for vocabulary management.
 */

const cache = new Map();

const getCached = async (key, fetcher, ttl = 60_000) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.timestamp < ttl) {
    return hit.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const clearCache = (keyPrefix) => {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
};

const BASE_URL = 'http://localhost:4000/api/v1';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Generic fetch wrapper with error handling
 */
const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      credentials: 'include', // Send cookies for auth
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[FluentezAPI] ${options.method || 'GET'} ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Get current user details
 * @returns {Promise<Object>} User details
 */
export const fetchUserDetails = () => {
  return apiFetch('/me');
};

/**
 * Get vocabularies for the current user (paginated)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} { data: VocabularyData[], totalCount: number }
 */
export const fetchVocabularies = (page = 1, limit = 7) => {
  return apiFetch(`/vocabularies?page=${page}&limit=${limit}`);
};

/**
 * Get meaning/phonetic data for a word
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} { data: { meaning, soundUk, soundUs, usPhonetic, ukPhonetic } }
 */
export const fetchMeaningWord = (word) => {
  if (!word?.trim()) {
    return Promise.resolve(null);
  }
  const normalized = word.trim().toLowerCase();
  return getCached(`meaning:${normalized}`, () => apiFetch(`/dictation/meaning/${encodeURIComponent(word.trim())}`));
};

/**
 * Add a vocabulary term to a vocabulary set
 * @param {Object} payload - { vocabulary: { term, definition }, vocabularyId }
 * @returns {Promise<Object>} API response
 */
export const updateQuickVocabulary = (payload) => {
  return apiFetch(`/vocabulary/quick/${payload.vocabularyId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
