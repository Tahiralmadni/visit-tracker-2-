/**
 * Storage Status Utility
 * Returns the current storage status based on date
 */

/**
 * Get the current storage status
 * @returns {'active' | 'warning' | 'expired'} - Current status
 */
export const getStorageStatus = () => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Warning period: August 30-31, 2025
  const warningStartDate = '2025-08-30';
  const warningEndDate = '2025-08-31';
  
  // Expiration date: September 2, 2025 at 00:00:00
  const expirationDate = '2025-09-02';
  
  // Check if we're in the warning period
  if (currentDate >= warningStartDate && currentDate <= warningEndDate) {
    return 'warning';
  }
  
  // Check if storage has expired
  if (currentDate >= expirationDate) {
    return 'expired';
  }
  
  // Otherwise, storage is active
  return 'active';
};

/**
 * Check if adding new entries is allowed
 * @returns {boolean} - Whether new entries can be added
 */
export const canAddEntries = () => {
  return getStorageStatus() !== 'expired';
};

/**
 * Get the appropriate message based on storage status
 * @returns {object} - Message configuration with type and text
 */
export const getStorageMessage = () => {
  const status = getStorageStatus();
  
  switch (status) {
    case 'warning':
      return {
        type: 'warning',
        text: '⚠️ Your data storage is almost full. Please upgrade before 1 September to continue without interruption.',
        show: true
      };
    case 'expired':
      return {
        type: 'error',
        text: '🚫 Your storage limit has been reached. Please upgrade to Premium to continue adding new entries.',
        show: true
      };
    case 'active':
    default:
      return {
        type: 'info',
        text: '',
        show: false
      };
  }
};
