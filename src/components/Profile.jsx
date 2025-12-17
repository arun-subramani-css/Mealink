import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, Heart, Clock, CheckCircle, Calendar } from 'lucide-react';

const notificationDistances = [1, 5, 10, 20]; // in km

const Profile = () => {
  const { currentUser, isGuest } = useAuth();
  const [donatedItems, setDonatedItems] = useState([]);
  const [reservedItems, setReservedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasMoreDonated, setHasMoreDonated] = useState(true);
  const [hasMoreReserved, setHasMoreReserved] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [notificationDistance, setNotificationDistance] = useState(() => {
    const saved = localStorage.getItem('notificationDistance');
    return saved ? Number(saved) : 5;
  });
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    if (currentUser) {
      console.log('Profile: User changed, fetching items');
      
      // Add loading timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.log('Profile: Loading timeout reached, forcing loading to false');
        setLoading(false);
      }, 3000); // Reduced to 3 seconds timeout
      
      fetchUserItems();
      
      return () => clearTimeout(loadingTimeout);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    localStorage.setItem('notificationDistance', notificationDistance);
  }, [notificationsEnabled, notificationDistance]);

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // Request permission
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      } else if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const fetchUserItems = async () => {
    if (!currentUser) return;

    if (isGuest) {
      const demoDonatedItems = [
        {
          id: 'demo-donated-1',
          title: 'Fresh Vegetables',
          category: 'food',
          description: 'Fresh organic vegetables from my garden.',
          quantity: 5,
          imageUrl: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500',
          location: {
            latitude: 13.0827,
            longitude: 80.2707,
            address: 'Chennai, Tamil Nadu'
          },
          contactInfo: {
            email: 'demo@example.com',
            phone: '+91-9876543210'
          },
          providerId: 'guest-user',
          providerName: 'Guest User',
          createdAt: new Date(),
          status: 'available',
          isVeg: true
        }
      ];

      const demoReservedItems = [
        {
          id: 'demo-reserved-1',
          title: 'Winter Jacket',
          category: 'clothes',
          description: 'Warm winter jacket in excellent condition.',
          quantity: 1,
          imageUrl: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=500',
          location: {
            latitude: 11.0168,
            longitude: 76.9558,
            address: 'Coimbatore, Tamil Nadu'
          },
          contactInfo: {
            email: 'provider@example.com',
            phone: '+91-9876543211'
          },
          providerId: 'demo-provider',
          providerName: 'Demo Provider',
          createdAt: new Date(),
          status: 'pending',
          condition: 'Like new',
          receiverId: 'guest-user'
        }
      ];

      setDonatedItems(demoDonatedItems);
      setReservedItems(demoReservedItems);
      setLoading(false);
      return;
    }

    try {
      console.log('Profile: Starting to fetch user items');
      
      // Set loading to false immediately to show the UI
      setLoading(false);
      
      // Fetch data in background with timeout
      const fetchWithTimeout = async (queryPromise, timeoutMs = 5000) => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        );
        return Promise.race([queryPromise, timeoutPromise]);
      };

      // Make both queries in parallel with timeout
      const [donatedResponse, reservedResponse] = await Promise.allSettled([
        fetchWithTimeout(usersAPI.getDonations({ limit: 5 })),
        fetchWithTimeout(usersAPI.getReservations({ limit: 5 }))
      ]);

      // Process results with error handling
      const donated = [];
      if (donatedResponse.status === 'fulfilled') {
        donatedResponse.value.donations.forEach((item) => {
          donated.push({ ...item, id: item._id });
        });
        setHasMoreDonated(donated.length === 5);
      } else {
        console.error('Profile: Donated items query failed:', donatedResponse.reason);
        setHasMoreDonated(false);
      }
      setDonatedItems(donated);

      const reserved = [];
      if (reservedResponse.status === 'fulfilled') {
        reservedResponse.value.reservations.forEach((item) => {
          reserved.push({ ...item, id: item._id });
        });
        setHasMoreReserved(reserved.length === 5);
      } else {
        console.error('Profile: Reserved items query failed:', reservedResponse.reason);
        setHasMoreReserved(false);
      }
      setReservedItems(reserved);
      
      console.log('Profile: Items fetched successfully', { donated: donated.length, reserved: reserved.length });
      
    } catch (error) {
      console.error('Profile: Error fetching user items:', error);
      // Set empty arrays on error to prevent loading state
      setDonatedItems([]);
      setReservedItems([]);
      setHasMoreDonated(false);
      setHasMoreReserved(false);
    }
  };

  const loadMoreDonated = async () => {
    if (!hasMoreDonated || !currentUser) return;
    
    try {
      const lastItem = donatedItems[donatedItems.length - 1];
      const donatedQuery = query(
        collection(db, 'donations'),
        where('providerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastItem.createdAt),
        limit(10)
      );
      
      const snapshot = await getDocs(donatedQuery);
      const newItems = [];
      snapshot.forEach((doc) => {
        newItems.push({ id: doc.id, ...doc.data() });
      });
      
      setDonatedItems(prev => [...prev, ...newItems]);
      setHasMoreDonated(newItems.length === 10);
    } catch (error) {
      console.error('Error loading more donated items:', error);
    }
  };

  const loadMoreReserved = async () => {
    if (!hasMoreReserved || !currentUser) return;
    
    try {
      const lastItem = reservedItems[reservedItems.length - 1];
      const reservedQuery = query(
        collection(db, 'donations'),
        where('receiverId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastItem.createdAt),
        limit(10)
      );
      
      const snapshot = await getDocs(reservedQuery);
      const newItems = [];
      snapshot.forEach((doc) => {
        newItems.push({ id: doc.id, ...doc.data() });
      });
      
      setReservedItems(prev => [...prev, ...newItems]);
      setHasMoreReserved(newItems.length === 10);
    } catch (error) {
      console.error('Error loading more reserved items:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <Package className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching your donations and reservations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {currentUser?.displayName || 'User'}
              </h1>
              <p className="text-green-100">{currentUser?.email}</p>
              {isGuest && (
                <span className="inline-block mt-2 text-xs bg-white/20 text-white px-3 py-1 rounded-full">
                  Guest Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('donated')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'donated'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>My Donations ({donatedItems.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reserved')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'reserved'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>My Reservations ({reservedItems.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mr-3">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Items Donated</p>
                      <p className="text-2xl font-bold text-green-600">{donatedItems.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {donatedItems.filter(item => item.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Reserved</p>
                      <p className="text-2xl font-bold text-purple-600">{reservedItems.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-gray-900 font-medium">{currentUser?.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900 font-medium">{currentUser?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'donated' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Donations</h2>
              {donatedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
                  <p className="text-gray-500 mb-4">You haven't donated any items yet.</p>
                  <p className="text-gray-400 text-sm">Switch to Provider mode to start donating!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donatedItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            Posted on {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMoreDonated && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMoreDonated}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Load More Donations
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reserved' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Reservations</h2>
              {reservedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                  <p className="text-gray-500 mb-4">You haven't reserved any items yet.</p>
                  <p className="text-gray-400 text-sm">Switch to Receiver mode to browse available items!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservedItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            Provider: {item.providerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reserved on {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMoreReserved && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMoreReserved}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Load More Reservations
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notification Settings */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={handleNotificationToggle}
                  className="form-checkbox h-5 w-5 text-green-600"
                />
                <span className="text-gray-700">Enable notifications for new donations near me</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Distance:</span>
                <select
                  value={notificationDistance}
                  onChange={e => setNotificationDistance(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                  disabled={!notificationsEnabled}
                >
                  {notificationDistances.map((km) => (
                    <option key={km} value={km}>{km} km</option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-500">
                {notificationPermission === 'granted'
                  ? 'Notifications enabled'
                  : notificationPermission === 'denied'
                  ? 'Notifications blocked in browser'
                  : 'Permission not requested'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;