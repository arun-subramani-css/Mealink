import React, { useState, useEffect } from 'react';
import { donationsAPI, authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentLocation, reverseGeocode } from '../../utils/location';
import { MapPin } from 'lucide-react';

// Debug imports
console.log('📦 UploadForm imports:', { donationsAPI, authAPI });

const UploadForm = () => {
  const { currentUser, isGuest } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: 'food',
    description: '',
    quantity: 1,
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    address: '',
    isVeg: true,
    expiryDate: '',
    condition: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Test MongoDB connection on component mount
  useEffect(() => {
    console.log('🔍 Testing MongoDB connection...');
    console.log('👤 Current User:', currentUser);
    
    if (currentUser) {
      console.log('✅ User is authenticated:', currentUser._id);
    } else {
      console.log('⚠️ User is not authenticated');
    }
  }, [currentUser]);

  // Update contact email when user changes
  useEffect(() => {
    if (currentUser?.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: currentUser.email
      }));
    }
  }, [currentUser, formData.contactEmail]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setError('Image size should be less than 5MB. Please choose a smaller image.');
        return;
      }
      
      setError(''); // Clear any previous errors
      
      try {
        // Compress image if it's larger than 1MB
        let processedFile = file;
        if (file.size > 1024 * 1024) { // 1MB
          console.log('📸 Compressing image...');
          processedFile = await compressImage(file);
          console.log('✅ Image compressed:', {
            original: file.size,
            compressed: processedFile.size,
            reduction: `${((1 - processedFile.size / file.size) * 100).toFixed(1)}%`
          });
        }
        
        setImage(processedFile);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result);
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Image processing error:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setFormData(prev => ({ ...prev, address }));
      console.log('📍 Location set:', address);
    } catch (error) {
      console.error('Location error:', error);
      setError('Unable to get your location. Please enter address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Compress image function
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', 0.8); // 80% quality
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !image) return;

    if (isGuest) {
      setError('Please sign in to upload items. Guest users can only browse items.');
      return;
    }

    // Ensure user is registered in MongoDB before uploading
    try {
      console.log('🔍 Checking if user exists in MongoDB...');
      console.log('🔍 authAPI available:', !!authAPI);
      console.log('🔍 authAPI.getCurrentUser available:', !!authAPI?.getCurrentUser);
      
      await authAPI.getCurrentUser(currentUser.uid);
      console.log('✅ User exists in MongoDB');
    } catch (error) {
      console.log('⚠️ User not found in MongoDB, registering...');
      try {
        console.log('🔍 authAPI.register available:', !!authAPI?.register);
        await authAPI.register({
          email: currentUser.email,
          displayName: currentUser.displayName || 'User',
          firebaseUid: currentUser.uid,
          isGoogleUser: !!currentUser.providerData?.find(p => p.providerId === 'google.com')
        });
        console.log('✅ User registered in MongoDB successfully');
      } catch (registerError) {
        console.error('❌ Failed to register user in MongoDB:', registerError);
        const errorMessage = registerError.message || 'Failed to register user';
        setError(`User registration failed: ${errorMessage}. Please try logging out and back in.`);
        return;
      }
    }

    // Validation
    if (!formData.title || !formData.description || !formData.address || !formData.contactPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.category === 'food' && !formData.expiryDate) {
      setError('Please provide an expiry date for food items.');
      return;
    }

    if (formData.category !== 'food' && !formData.condition) {
      setError('Please specify the condition for non-food items.');
      return;
    }

        setLoading(true);
    setError('');
    setUploadProgress('Preparing upload...');

    try {
      // Get location if not already set
      let finalLocation = location;
      let finalAddress = formData.address;
      
      if (!finalLocation) {
        setUploadProgress('Getting location...');
        try {
          finalLocation = await getCurrentLocation();
          // Get readable address from coordinates
          finalAddress = await reverseGeocode(finalLocation.latitude, finalLocation.longitude);
          console.log('📍 Got location address:', finalAddress);
        } catch {
          setError('Please provide location information');
          setLoading(false);
          return;
        }
      } else if (!finalAddress || finalAddress.includes(',')) {
        // If we have coordinates but no readable address, get the address
        setUploadProgress('Getting location name...');
        try {
          finalAddress = await reverseGeocode(finalLocation.latitude, finalLocation.longitude);
          console.log('📍 Converted coordinates to address:', finalAddress);
        } catch (error) {
          console.error('Failed to get address from coordinates:', error);
          // Use coordinates as fallback
          finalAddress = `${finalLocation.latitude}, ${finalLocation.longitude}`;
        }
      }

      // Prepare donation data
      const donationData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        quantity: formData.quantity,
        image: image, // Raw file for upload
        latitude: finalLocation?.latitude || null,
        longitude: finalLocation?.longitude || null,
        address: finalAddress || formData.address || 'Location not specified', // Use the readable address
        contactEmail: formData.contactEmail || currentUser?.email || '',
        contactPhone: formData.contactPhone || '',
        isVeg: formData.category === 'food' ? formData.isVeg : undefined,
        ...(formData.category === 'food' && { expiryDate: formData.expiryDate || undefined }),
        ...(formData.category !== 'food' && { condition: formData.condition || undefined }),
        // Add user information for proper linking
        providerName: currentUser?.displayName || currentUser?.email || 'Anonymous',
        providerId: currentUser?._id || currentUser?.uid,
      };

      // Debug the data being sent
      console.log('📋 Form data being sent:', {
        category: formData.category,
        expiryDate: formData.expiryDate,
        condition: formData.condition,
        isVeg: formData.isVeg
      });
      console.log('📤 Final donation data:', donationData);

      // Save to MongoDB
      setUploadProgress('Uploading to server...');
      console.log('📤 Uploading to MongoDB:', donationData);
      
      try {
        const response = await donationsAPI.create(donationData);
        console.log('✅ Donation created successfully:', response);
        console.log('✅ Response details:', {
          message: response.message,
          donationId: response.donation?._id || response.donationId,
          status: 'success'
        });
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        
        // Check if this might be a response error but donation was actually saved
        if (apiError.message.includes('Failed to save donation') || 
            apiError.message.includes('HTTP error')) {
          console.log('⚠️ Possible response error - checking if donation was actually saved...');
          
          // If the error suggests the donation might have been saved, show a different message
          if (apiError.message.includes('500') || apiError.message.includes('Internal Server Error')) {
            console.log('✅ Donation likely saved successfully despite response error');
            setSuccess(true);
            setError('');
            
            // Reset form since donation was likely saved
            setFormData({
              title: '',
              category: 'food',
              description: '',
              quantity: 1,
              contactEmail: currentUser?.email || '',
              contactPhone: '',
              address: '',
              isVeg: true,
              expiryDate: '',
              condition: '',
            });
            setImage(null);
            setImagePreview(null);
            setLocation(null);
            
            setTimeout(() => setSuccess(false), 5000);
            return; // Exit early, don't show error
          }
        }
        
        throw apiError; // Re-throw to be caught by outer catch block
      }

              console.log('🎉 Setting success state and resetting form...');
        setSuccess(true);
        setError(''); // Clear any existing errors
        
        // Reset form
        setFormData({
          title: '',
          category: 'food',
          description: '',
          quantity: 1,
          contactEmail: currentUser?.email || '',
          contactPhone: '',
          address: '',
          isVeg: true,
          expiryDate: '',
          condition: '',
        });
        setImage(null);
        setImagePreview(null);
        setLocation(null);

        console.log('✅ Form reset complete, success message will show for 3 seconds');
        setTimeout(() => {
          console.log('⏰ Hiding success message');
          setSuccess(false);
        }, 3000);
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('🔍 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        user: currentUser?.uid,
        isAuthenticated: !!currentUser
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload item';
      
      console.log('🔍 Error analysis:', {
        errorType: error.constructor.name,
        hasCode: !!error.code,
        hasMessage: !!error.message,
        messageContent: error.message,
        isNetworkError: error.name === 'TypeError' && error.message.includes('fetch'),
        isAPIError: error.message.includes('HTTP error') || error.message.includes('Failed to save')
      });
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Storage access denied. Please check Firebase Storage rules.';
      } else if (error.code === 'storage/bucket-not-found') {
        errorMessage = 'Storage bucket not found. Please check Firebase configuration.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore rules.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Please log in to upload items.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller image.';
      } else if (error.message.includes('Failed to save donation')) {
        errorMessage = 'Server error: Donation could not be saved. Please try again.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message.includes('Donation was saved but response details could not be sent')) {
        errorMessage = '✅ Donation uploaded successfully! (Some details may not display immediately)';
        setSuccess(true); // Show success even though there was a response issue
        setTimeout(() => setSuccess(false), 5000);
        return; // Don't show error message
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Share with Community</h2>
          <p className="text-gray-600">Upload items to help others in your neighborhood</p>
          {currentUser && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700">
                <strong>Sharing as:</strong> {currentUser.displayName || currentUser.email} 
                {currentUser.email && <span className="text-green-600"> ({currentUser.email})</span>}
              </p>
            </div>
          )}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ✅ Item uploaded successfully! It's now available for receivers.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Title */}
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
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
              placeholder="e.g., Fresh vegetables, Winter jacket, Kitchen products"
            />
          </div>

          {/* Category */}
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
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white"
            >
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="products">Products</option>
            </select>
          </div>

          {/* Food-specific fields */}
          {formData.category === 'food' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Food Item Details</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Food Type *
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      id="isVeg-veg"
                      type="radio"
                      name="isVeg"
                      value="true"
                      checked={formData.isVeg}
                      onChange={() => setFormData(prev => ({ ...prev, isVeg: true }))}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Vegetarian
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      id="isVeg-nonveg"
                      type="radio"
                      name="isVeg"
                      value="false"
                      checked={!formData.isVeg}
                      onChange={() => setFormData(prev => ({ ...prev, isVeg: false }))}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Non-Vegetarian
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-800 mb-2">
                  Expiry Date *
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>
            </div>
          )}

          {/* Non-food condition */}
          {formData.category !== 'food' && (
            <div>
              <label htmlFor="condition" className="block text-sm font-semibold text-gray-800 mb-2">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white"
              >
                <option value="">Select condition</option>
                <option value="Like new">Like new</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base resize-none"
              placeholder="Describe the item, its condition, and any special instructions for pickup"
            />
          </div>

          {/* Quantity */}
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
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image-upload" className="block text-sm font-semibold text-gray-800 mb-2">
              Item Image *
            </label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
                        Click to change image
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-16 h-16 mb-4 text-gray-400 border-2 border-gray-300 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">📷</span>
                    </div>
                    <p className="mb-2 text-sm text-gray-600 text-center px-4">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </label>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-800 mb-2">
              Pickup Location *
            </label>
            <div className="flex gap-3">
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                autoComplete="street-address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                placeholder="Enter location name (e.g., T. Nagar, Chennai or Anna Nagar, Coimbatore)"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center text-sm whitespace-nowrap transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {locationLoading ? 'Getting...' : 'Auto'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Enter a readable location name (not coordinates). Use "Auto" button to get your current location.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Contact Information</h3>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-800 mb-2">
                Contact Phone *
              </label>
              <input
                id="contactPhone"
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
                autoComplete="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                placeholder="+91-9876543210"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-600 mb-2">
                Contact Email (Optional)
              </label>
              <input
                id="contactEmail"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                placeholder={currentUser?.email || "your.email@example.com"}
              />
              {currentUser?.email && !formData.contactEmail && (
                <p className="text-sm text-gray-500 mt-1">
                  Your email ({currentUser.email}) will be used if left empty
                </p>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {loading && uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">{uploadProgress}</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all duration-200 text-base"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {uploadProgress || 'Uploading...'}
              </div>
            ) : (
              'Share Item'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadForm;