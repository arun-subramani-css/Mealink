const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get the image URL for a donation
 * @param {string} donationId - The donation ID
 * @returns {string} The image URL
 */
export const getDonationImageUrl = (donationId) => {
  return `${API_BASE_URL}/donations/image/${donationId}`;
};

/**
 * Get a fallback image URL for when the donation image fails to load
 * @returns {string} The fallback image URL
 */
export const getFallbackImageUrl = () => {
  return 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500';
};

/**
 * Handle image load error and set fallback
 * @param {Event} e - The error event
 * @param {string} donationId - The donation ID for logging
 */
export const handleImageError = (e, donationId) => {
  console.log('Image failed to load for donation ID:', donationId);
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = getFallbackImageUrl();
};
