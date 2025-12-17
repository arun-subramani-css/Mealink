import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestsAPI, healthCheck } from '../services/api';

const RequestEssentialsForm = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'food',
    priority: 'medium',
    quantity: 1,
    unit: 'kg', // Set default unit for food category
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    disasterType: 'other',
    disasterLocation: '',
    disasterDate: '',
    expiresInDays: 7,
    phone: ''
  });

  const [locationData, setLocationData] = useState({
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  const categories = [
    { value: 'food', label: 'Food & Water', units: ['kg', 'packets', 'bottles', 'cans', 'boxes'] },
    { value: 'medicine', label: 'Medicine & First Aid', units: ['packs', 'bottles', 'pieces', 'boxes'] },
    { value: 'clothing', label: 'Clothing & Blankets', units: ['pieces', 'sets', 'pairs', 'bundles'] },
    { value: 'shelter', label: 'Shelter & Tents', units: ['tents', 'tarps', 'pieces', 'sets'] },
    { value: 'hygiene', label: 'Hygiene & Sanitation', units: ['bottles', 'packs', 'pieces', 'boxes'] },
    { value: 'other', label: 'Other Essentials', units: ['pieces', 'sets', 'boxes', 'units'] }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const disasterTypes = [
    { value: 'flood', label: 'Flood' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'hurricane', label: 'Hurricane' },
    { value: 'wildfire', label: 'Wildfire' },
    { value: 'pandemic', label: 'Pandemic' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Set default address if user has location data
    if (currentUser?.address) {
      setFormData(prev => ({ ...prev, address: currentUser.address }));
    }
    if (currentUser?.city) {
      setFormData(prev => ({ ...prev, city: currentUser.city }));
    }
    if (currentUser?.state) {
      setFormData(prev => ({ ...prev, state: currentUser.state }));
    }
    if (currentUser?.postalCode) {
      setFormData(prev => ({ ...prev, postalCode: currentUser.postalCode }));
    }
    if (currentUser?.country) {
      setFormData(prev => ({ ...prev, country: currentUser.country }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update units when category changes
    if (name === 'category') {
      const selectedCategory = categories.find(cat => cat.value === value);
      if (selectedCategory && selectedCategory.units.length > 0) {
        setFormData(prev => ({ ...prev, unit: selectedCategory.units[0] }));
      }
    }
  };

  const handleLocationClick = async () => {
    try {
      setIsLocationLoading(true);
      setError('');
      
      // Get current location using navigator.geolocation
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en&zoom=18`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Nominatim API response:', data); // Debug log
      
      // Extract address components with better fallbacks
      const address = data.address || {};
      
      // Street address - try multiple possible fields
      const street = address.road || address.street || address.house_number || address.suburb || '';
      const houseNumber = address.house_number || '';
      const suburb = address.suburb || address.neighbourhood || '';
      
      // City - try multiple possible fields
      const city = address.city || address.town || address.village || address.county || address.municipality || '';
      
      // State - try multiple possible fields
      const state = address.state || address.province || address.region || '';
      
      // Postal code
      const postalCode = address.postcode || '';
      
      // Country
      const country = address.country || '';
      
      // Create full street address with better logic
      let fullAddress = '';
      if (houseNumber && street) {
        fullAddress = `${houseNumber} ${street}`;
      } else if (street) {
        fullAddress = street;
      } else if (suburb) {
        fullAddress = suburb;
      } else if (city) {
        fullAddress = city;
      }
      
      // If we still don't have an address, use the display_name as fallback
      if (!fullAddress && data.display_name) {
        const displayParts = data.display_name.split(', ');
        fullAddress = displayParts[0] || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      
      // Final fallback to coordinates if no address found
      if (!fullAddress) {
        fullAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      
      const addressData = {
        address: fullAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim()
      };
      
      console.log('Parsed address data:', addressData); // Debug log
      
      setLocationData({
        latitude,
        longitude,
        ...addressData
      });
      
      setFormData(prev => ({
        ...prev,
        ...addressData
      }));
      
      // Show success message
      setSuccess('Location retrieved successfully! Address fields have been filled.');
      
    } catch (error) {
      console.error('Location error:', error);
      
      if (error.code === 1) {
        setError('Location permission denied. Please allow location access or enter address manually.');
      } else if (error.code === 2) {
        setError('Location unavailable. Please check your device settings or enter address manually.');
      } else if (error.code === 3) {
        setError('Location request timed out. Please try again or enter address manually.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error. Please check your internet connection or enter address manually.');
      } else {
        setError('Could not get your location. Please enter address manually.');
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Quick backend connectivity check
      try {
        await healthCheck();
      } catch (backendError) {
        throw new Error(`Backend server is not accessible: ${backendError.message}. Please ensure the backend server is running.`);
      }

      console.log('👤 Current user:', currentUser);
      console.log('🔑 Firebase UID:', currentUser.uid);
      console.log('📋 Local storage Firebase UID:', localStorage.getItem('firebaseUID'));

      // Ensure we have all required fields
      if (!formData.title || !formData.description || !formData.category || !formData.quantity || !formData.unit || !formData.address) {
        throw new Error('Please fill in all required fields. Make sure to click "Use My Location" or enter an address manually.');
      }

      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        address: formData.address.trim(),
        city: formData.city.trim() || '',
        state: formData.state.trim() || '',
        postalCode: formData.postalCode.trim() || '',
        country: formData.country.trim() || '',
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        disasterType: formData.disasterType,
        disasterLocation: formData.disasterLocation.trim() || '',
        disasterDate: formData.disasterDate || null,
        expiresInDays: Number(formData.expiresInDays),
        phone: formData.phone.trim()
      };

      console.log('Submitting request data:', requestData);

      console.log('About to call requestsAPI.create with data:', requestData);
      console.log('Firebase UID being sent:', localStorage.getItem('firebaseUID'));
      
      const response = await requestsAPI.create(requestData);
      
      console.log('Request created successfully:', response);
      
      setSuccess('Request created successfully! It will now appear in the Disaster Requests tab. Other users will be notified.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'food',
        priority: 'medium',
        quantity: 1,
        unit: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        disasterType: 'other',
        disasterLocation: '',
        disasterDate: '',
        expiresInDays: 7,
        phone: ''
      });
      
      setLocationData({
        latitude: null,
        longitude: null,
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      });

      if (onSuccess) {
        onSuccess(response.request);
      }
      
      // Dispatch custom event to refresh requests list
      window.dispatchEvent(new CustomEvent('requestCreated', { detail: response.request }));

      // Auto-close after 3 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);

    } catch (error) {
      console.error('Error creating request:', error);
      setError(error.message || 'Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed debug/test helper functions

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Request Essentials</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                  Item Title *
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Clean drinking water, First aid kit"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-800 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="Describe what you need, any specific requirements, and why it's needed"
              />
            </div>

            {/* Priority and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-800 mb-2">
                  Priority Level *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-800 mb-2">
                  Quantity *
                </label>
                <input
                  id="quantity"
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-semibold text-gray-800 mb-2">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {selectedCategory?.units.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Disaster Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disasterType" className="block text-sm font-semibold text-gray-800 mb-2">
                  Disaster Type
                </label>
                <select
                  id="disasterType"
                  name="disasterType"
                  value={formData.disasterType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {disasterTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="disasterLocation" className="block text-sm font-semibold text-gray-800 mb-2">
                  Disaster Location
                </label>
                <input
                  id="disasterLocation"
                  type="text"
                  name="disasterLocation"
                  value={formData.disasterLocation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Chennai, Tamil Nadu"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">
                Contact Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="+91-9876543210"
              />
              <p className="text-xs text-gray-600 mt-1">
                This number will be visible to users who want to help with your request
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Pickup/Delivery Location *
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={handleLocationClick}
                  disabled={isLocationLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLocationLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      Use My Location
                    </>
                  )}
                </button>
                {locationData.latitude && locationData.longitude && (
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </div>
                )}
                {/* Debug/test buttons removed */}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Click "Use My Location" to automatically fill address fields, or enter them manually below.
              </p>
              {/* Troubleshooting hint removed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      formData.address ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    placeholder="Street address"
                  />
                  {formData.address && (
                    <div className="text-xs text-green-600 mt-1">Address filled from location</div>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Postal Code"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label htmlFor="expiresInDays" className="block text-sm font-semibold text-gray-800 mb-2">
                Request Expires In
              </label>
              <select
                id="expiresInDays"
                name="expiresInDays"
                value={formData.expiresInDays}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
                <option value={30}>1 month</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating Request...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestEssentialsForm;
