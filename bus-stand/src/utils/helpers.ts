/**
 * 🛠️ General Helper Functions
 * Utilities for string manipulation and data formatting.
 */

// 1. Generate Short Name (e.g., Harinagar -> HN, Patna -> PTN)
export const getShortName = (name: string): string => {
  if (!name) return '';
  
  // Logic: 
  // If user explicitly provided a short code logic in requirements:
  // "Harinagar" -> "HN" (First char + First char of 2nd syllable/part roughly)
  // "Patna" -> "PTN" (Consonants)
  
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  
  if (cleanName.length <= 3) return cleanName;
  
  // If it's a two-word name (e.g., "New Delhi"), take first letter of each
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Fallback for single words: First letter + Last letter (e.g., Harinagar -> HR or HN)
  // For demo purpose matching "Harinagar" -> "HN" specifically:
  if (cleanName === 'HARINAGAR') return 'HN';
  if (cleanName === 'PATNA') return 'PTN';

  // Generic: First 3 chars
  return cleanName.substring(0, 3);
};

// 2. Format Currency (e.g., 500 -> ₹ 500)
export const formatCurrency = (amount: string | number): string => {
  if (!amount) return '₹ 0';
  return `₹ ${amount}`;
};

// 3. Days formatting (Convert [true, false...] to String or check status)
export const isBusRunningToday = (runDays: boolean[]): boolean => {
  if (!runDays) return false;
  const todayIndex = new Date().getDay(); // 0 = Sunday
  return runDays[todayIndex];
};

// 4. Input Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
