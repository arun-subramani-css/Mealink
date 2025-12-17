import React, { useState } from 'react';
import { MapPin, Phone, Mail, Calendar, Leaf, Package, MessageCircle, ExternalLink } from 'lucide-react';
import { calculateDistance } from '../../utils/location';
import { getDonationImageUrl, handleImageError } from '../../utils/imageUtils';

const ItemCard = ({ item, userLocation, onRequestItem }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.location.latitude,
        item.location.longitude
      )
    : null;

  const getCategoryColor = (category) => {
    switch (category) {
      case 'food':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'clothes':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'products':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`;
    window.open(url, '_blank');
  };

  const handleImageError = (e, donationId) => {
    console.log('Image failed to load for donation ID:', donationId);
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = getFallbackImageUrl();
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 h-full flex flex-col group">
        <div className="relative overflow-hidden">
          {imageLoading && (
            <div className="w-full h-48 sm:h-52 bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
          <img
            src={getDonationImageUrl(item._id)}
            alt={item.title}
            className={`w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-300 ${imageLoading ? 'hidden' : ''}`}
            onError={(e) => handleImageError(e, item._id)}
            onLoad={handleImageLoad}
          />

          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          </div>
          {distance && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
              {distance.toFixed(1)} km
            </div>
          )}
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
          </div>
          
          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-center text-sm text-gray-500">
              <Package className="w-4 h-4 mr-2 text-gray-400" />
              <span>Qty: {item.quantity}</span>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{item.location.address}</span>
            </div>

            {item.category === 'food' && item.isVeg && (
              <div className="flex items-center text-sm text-green-600">
                <Leaf className="w-4 h-4 mr-2" />
                <span>Vegetarian</span>
              </div>
            )}

            {item.expiryDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Expires: {formatDate(item.expiryDate)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-auto">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
            >
              Details
            </button>
            <button
              onClick={() => onRequestItem(item)}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Request</span>
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 pr-4">{item.title}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <img
                src={getDonationImageUrl(item._id)}
                alt={item.title}
                className="w-full h-64 object-cover rounded-xl mb-6"
                onError={(e) => handleImageError(e, item._id)}
                onLoad={handleImageLoad}
              />


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Item Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600 w-20">Category:</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600 w-20">Quantity:</span>
                      <span className="text-gray-800">{item.quantity}</span>
                    </div>
                    {item.condition && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Condition:</span>
                        <span className="text-gray-800">{item.condition}</span>
                      </div>
                    )}
                    {item.category === 'food' && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Type:</span>
                        <span className={`flex items-center ${item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                          <Leaf className="w-4 h-4 mr-1" />
                          {item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        </span>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Expires:</span>
                        <span className="text-gray-600">{formatDate(item.expiryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600 text-sm">Provider:</span>
                      <p className="text-gray-800 font-medium">{item.providerName}</p>
                    </div>
                    {item.contactInfo.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={`tel:${item.contactInfo.phone}`} className="text-green-600 hover:text-green-700 font-medium">
                          {item.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={`mailto:${item.contactInfo.email}`} className="text-green-600 hover:text-green-700 font-medium">
                        {item.contactInfo.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">Description</h4>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">Pickup Location</h4>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                    <span>{item.location.address}</span>
                  </div>
                  <button
                    onClick={openGoogleMaps}
                    className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Maps</span>
                  </button>
                </div>
                {distance && (
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    📍 Distance: {distance.toFixed(1)} km from your location
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onRequestItem(item);
                    setShowDetails(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Request Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemCard;