/**
 * API Configuration
 * Uses environment variable VITE_API_BASE_URL set in .env files
 * Defaults to http://localhost:8000 if not set
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper function to build full API URLs
 * @param {string} path - The API endpoint path (e.g., '/api/login')
 * @returns {string} - The full API URL
 */
export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
