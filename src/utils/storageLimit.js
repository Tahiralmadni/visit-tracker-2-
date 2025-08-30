// Storage limit configuration and utilities
import dayjs from 'dayjs';

// Configuration for storage limit dates
const STORAGE_LIMIT_CONFIG = {
  warningStartDate: '2025-08-30',
  warningEndDate: '2025-08-31',
  blockStartDate: '2025-09-01',
};

/**
 * Check the current storage status based on date
 * @returns {Object} Status object with type and message
 */
export const checkStorageStatus = () => {
  const now = dayjs();
  const warningStart = dayjs(STORAGE_LIMIT_CONFIG.warningStartDate);
  const warningEnd = dayjs(STORAGE_LIMIT_CONFIG.warningEndDate).endOf('day');
  const blockStart = dayjs(STORAGE_LIMIT_CONFIG.blockStartDate);

  // Check if we're in the warning period
  if (now.isAfter(warningStart.subtract(1, 'second')) && now.isBefore(warningEnd.add(1, 'second'))) {
    return {
      type: 'warning',
      canAdd: true,
      canEdit: true,
      message: {
        en: '⚠️ Your data is almost out of storage. Please upgrade before 1 September to continue without interruption.',
        ur: '⚠️ آپ کا ڈیٹا اسٹوریج ختم ہونے والا ہے۔ براہ کرم 1 ستمبر سے پہلے اپ گریڈ کریں تاکہ بغیر کسی رکاوٹ کے جاری رکھ سکیں۔'
      }
    };
  }

  // Check if we're past the block date
  if (now.isAfter(blockStart.subtract(1, 'second'))) {
    return {
      type: 'blocked',
      canAdd: false,
      canEdit: false,
      message: {
        en: '🚫 Your storage is out of limit. Please upgrade to Premium to continue adding or editing entries.',
        ur: '🚫 آپ کی اسٹوریج کی حد ختم ہو گئی ہے۔ براہ کرم اینٹریز شامل کرنے یا ترمیم کرنے کے لیے پریمیم میں اپ گریڈ کریں۔'
      }
    };
  }

  // Normal operation
  return {
    type: 'normal',
    canAdd: true,
    canEdit: true,
    message: null
  };
};

/**
 * Check if adding new entries is allowed
 * @returns {boolean}
 */
export const canAddEntry = () => {
  const status = checkStorageStatus();
  return status.canAdd;
};

/**
 * Check if editing existing entries is allowed
 * @returns {boolean}
 */
export const canEditEntry = () => {
  const status = checkStorageStatus();
  return status.canEdit;
};

/**
 * Get the appropriate message for the current storage status
 * @param {string} language - Current language ('en' or 'ur')
 * @returns {string|null}
 */
export const getStorageMessage = (language = 'en') => {
  const status = checkStorageStatus();
  return status.message ? status.message[language] || status.message.en : null;
};

/**
 * Format date for display based on current status
 * @param {string} language - Current language
 * @returns {Object} Formatted dates for display
 */
export const getStorageLimitDates = (language = 'en') => {
  const formatDate = (date) => {
    const formatted = dayjs(date).format('D MMMM YYYY');
    if (language === 'ur') {
      return formatted.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return formatted;
  };

  return {
    warningStart: formatDate(STORAGE_LIMIT_CONFIG.warningStartDate),
    warningEnd: formatDate(STORAGE_LIMIT_CONFIG.warningEndDate),
    blockStart: formatDate(STORAGE_LIMIT_CONFIG.blockStartDate)
  };
};
