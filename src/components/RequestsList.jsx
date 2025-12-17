import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestsAPI } from '../services/api';

const RequestsList = forwardRef((props, ref) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [selectedCategory, showUrgentOnly]);

  // Listen for new request creation events
  useEffect(() => {
    const handleRequestCreated = (event) => {
      console.log('New request created, refreshing list...', event.detail);
      setSuccess('New request added! The list has been refreshed.');
      
      // Add the new request to the current list immediately
      if (event.detail && event.detail._id) {
        setRequests(prev => [event.detail, ...prev]);
      }
      
      // Also fetch fresh data from server
      fetchRequests();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    };

    window.addEventListener('requestCreated', handleRequestCreated);
    
    return () => {
      window.removeEventListener('requestCreated', handleRequestCreated);
    };
  }, []);

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshRequests: fetchRequests
  }));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let response;
      
      if (showUrgentOnly) {
        response = await requestsAPI.getUrgent();
      } else if (selectedCategory === 'all') {
        response = await requestsAPI.getAll();
      } else {
        response = await requestsAPI.getByCategory(selectedCategory);
      }
      
      setRequests(response.requests || []);
      setError('');
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, canProvide, message = '') => {
    try {
      await requestsAPI.respond(requestId, {
        canProvide,
        message
      });
      
      // Refresh the requests list
      fetchRequests();
      
      // Show success message
      alert(canProvide ? 'Response sent! The requester will contact you.' : 'Response sent!');
      
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to send response. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const formatExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInHours = Math.floor((expiry - now) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Expired';
    if (diffInHours < 24) return `Expires in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Expires in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchRequests}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Disaster Essentials Requests</h1>
        <p className="text-gray-600 mb-4">
          Help people in need by responding to requests for essential items during disaster situations.
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Categories</option>
              <option value="food">Food & Water</option>
              <option value="medicine">Medicine & First Aid</option>
              <option value="clothing">Clothing & Blankets</option>
              <option value="shelter">Shelter & Tents</option>
              <option value="hygiene">Hygiene & Sanitation</option>
              <option value="other">Other Essentials</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUrgentOnly}
              onChange={(e) => setShowUrgentOnly(e.target.checked)}
              className="rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">Show urgent requests only</span>
          </label>

          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {showUrgentOnly ? 'No urgent requests at the moment.' : 'No requests found for this category.'}
          </div>
          <p className="text-gray-400">Check back later or try a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request, index) => (
            <div
              key={request._id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
            >
              {/* Request Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-800 flex-1 mr-3">{request.title}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {request.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Request Content */}
              <div className="flex-1 p-4 space-y-3">
                {/* Description */}
                <p className="text-sm text-gray-800 font-medium">{request.description}</p>
                
                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Quantity:</span>
                    <div className="text-gray-800">{request.quantity} {request.unit}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Requester:</span>
                    <div className="text-gray-800 truncate">{request.requesterName}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Location:</span>
                    <div className="text-gray-800 truncate">{request.location.address}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Disaster:</span>
                    <div className="text-gray-800 truncate">{request.disasterType}</div>
                  </div>
                </div>

                {/* Disaster Location */}
                {request.disasterLocation && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Location:</span> {request.disasterLocation}
                    </div>
                  </div>
                )}

                {/* Time and Expiry */}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>{formatTimeAgo(request.createdAt)}</div>
                  <div className={`font-medium ${formatExpiry(request.expiresAt).includes('Expired') ? 'text-red-500' : 'text-green-600'}`}>
                    {formatExpiry(request.expiresAt)}
                  </div>
                </div>

                {/* Responses Count */}
                {request.responses && request.responses.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">{request.responses.length} response{request.responses.length > 1 ? 's' : ''}</span> received
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(request._id, true, 'I can provide this item. Please contact me.')}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    I Can Help
                  </button>
                  <button
                    onClick={() => handleRespond(request._id, false, 'I cannot provide this item at the moment.')}
                    className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cannot Help
                  </button>
                </div>
                <button
                  onClick={() => alert(`Contact: ${request.requesterName}\nPhone: ${request.requesterPhone}\nEmail: ${request.requesterEmail}`)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default RequestsList;
