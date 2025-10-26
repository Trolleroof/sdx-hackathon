// Date utility functions for handling expiries and tenors

/**
 * Convert a tenor string to an ISO date
 * @param {string} tenor - Text like "next month", "next week", "3 months"
 * @returns {string} ISO date string
 */
export function tenorToISO(tenor) {
  const now = new Date();
  const lowerTenor = tenor.toLowerCase().trim();

  if (lowerTenor.includes('next month')) {
    return nextMonthThirdFriday(now);
  }
  if (lowerTenor.includes('next week')) {
    return nextFriday(now);
  }
  if (lowerTenor.includes('this month')) {
    return thisMonthThirdFriday(now);
  }
  
  // Handle "X months" pattern
  const monthsMatch = lowerTenor.match(/(\d+)\s*month/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const targetDate = new Date(now);
    targetDate.setMonth(now.getMonth() + months);
    return thirdFridayOfMonth(targetDate);
  }

  // Default to next month's third Friday (standard options expiry)
  return nextMonthThirdFriday(now);
}

/**
 * Get next Friday from a date
 */
function nextFriday(date) {
  const result = new Date(date);
  const daysUntilFriday = (5 - result.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilFriday);
  return result.toISOString().split('T')[0];
}

/**
 * Get the third Friday of a given month
 */
function thirdFridayOfMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstFriday = 5 - firstDay.getDay();
  const thirdFriday = firstFriday + 14;
  return new Date(year, month, thirdFriday).toISOString().split('T')[0];
}

/**
 * Get next month's third Friday (standard monthly expiry)
 */
function nextMonthThirdFriday(date) {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return thirdFridayOfMonth(nextMonth);
}

/**
 * Get this month's third Friday
 */
function thisMonthThirdFriday(date) {
  return thirdFridayOfMonth(date);
}

/**
 * Check if a date string is valid ISO format
 */
export function isValidISO(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Format date to readable string
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
