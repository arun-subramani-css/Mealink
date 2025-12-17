import React, { useState, useEffect } from 'react';
import { donationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentLocation, calculateDistance } from '../../utils/location';
import ItemCard from './ItemCard';
import { MapPin, Search, X, Filter } from 'lucide-react';

const tamilNaduCities = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi', 'Dindigul', 'Thanjavur',
  'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil',
  'Kanchipuram', 'Kumarakonam', 'Pudukkottai', 'Pollachi', 'Rajapalayam'
];

const ItemsGrid = () => {
  const { currentUser, isGuest } = useAuth();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    distance: 'all',
    search: '',
    city: 'all',
  });

  useEffect(() => {
    console.log('ItemsGrid: Component mounted, starting to fetch items');
    
    // Add loading timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('ItemsGrid: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000); // 5 seconds timeout
    
    requestLocationPermission();
    fetchItems();
    
    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filters, userLocation]);

  const requestLocationPermission = async () => {
    try {
      const coords = await getCurrentLocation();
      setUserLocation(coords);
      setLocationPermission('granted');
    } catch (error) {
      setLocationPermission('denied');
    }
  };

  const fetchItems = async () => {
    console.log('ItemsGrid: Starting to fetch items');
    
    if (isGuest) {
      console.log('ItemsGrid: Guest mode, using demo items');
      const demoItems = [
        {
          _id: 'demo-1',
          title: 'Fresh Vegetables',
          category: 'food',
          description: 'Fresh organic vegetables from my garden. Perfect for a healthy meal!',
          quantity: 5,
          imageUrl: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=500',
          location: {
            latitude: 13.0827,
            longitude: 80.2707,
            address: 'T. Nagar, Chennai, Tamil Nadu 600017'
          },
          contactInfo: {
            email: 'demo@example.com',
            phone: '+91-9876543210'
          },
          providerId: { _id: 'demo-provider', displayName: 'Demo Provider' },
          providerName: 'Demo Provider',
          createdAt: new Date(),
          status: 'available',
          isVeg: true
        },
        {
          _id: 'demo-2',
          title: 'Winter Jacket',
          category: 'clothes',
          description: 'Warm winter jacket in excellent condition. Size Medium.',
          quantity: 1,
          imageUrl: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=500',
          location: {
            latitude: 11.0168,
            longitude: 76.9558,
            address: 'RS Puram, Coimbatore, Tamil Nadu 641002'
          },
          contactInfo: {
            email: 'demo2@example.com',
            phone: '+91-9876543211'
          },
          providerId: { _id: 'demo-provider-2', displayName: 'Demo Provider 2' },
          providerName: 'Demo Provider 2',
          createdAt: new Date(),
          status: 'available',
          condition: 'Like new'
        },
        {
          _id: 'demo-3',
                  title: 'Kitchen Products Set',
        category: 'products',
        description: 'Complete set of kitchen products in good condition.',
          quantity: 1,
          imageUrl: 'https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg?auto=compress&cs=tinysrgb&w=500',
          location: {
            latitude: 9.9252,
            longitude: 78.1198,
            address: 'Anna Nagar, Madurai, Tamil Nadu 625020'
          },
          contactInfo: {
            email: 'demo3@example.com',
            phone: '+91-9876543212'
          },
          providerId: { _id: 'demo-provider-3', displayName: 'Demo Provider 3' },
          providerName: 'Demo Provider 3',
          createdAt: new Date(),
          status: 'available',
          condition: 'Good'
        }
      ];

      setItems(demoItems);
      setLoading(false);
      return;
    }

    try {
      console.log('ItemsGrid: Fetching donations from MongoDB');
      
      // Set loading to false immediately to show the UI
      setLoading(false);
      
      const response = await donationsAPI.getAll({ limit: 20 });
      console.log('ItemsGrid: Received data from MongoDB', response.donations.length, 'items');
      
      // Transform MongoDB data to match expected format
      const fetchedItems = response.donations.map(donation => ({
        ...donation,
        id: donation._id, // Add id field for compatibility
        providerId: donation.providerId || { _id: donation.providerId, displayName: donation.providerName }
      }));
      
      setItems(fetchedItems);
    } catch (error) {
      console.error('ItemsGrid: Error fetching items:', error);
      setItems([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.city !== 'all') {
      filtered = filtered.filter(item => 
        item.location.address.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.search) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.distance !== 'all' && userLocation) {
      const maxDistance = parseInt(filters.distance);
      filtered = filtered.filter(item => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.location.latitude,
          item.location.longitude
        );
        return distance <= maxDistance;
      });
    }

    if (userLocation) {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distanceA - distanceB;
      });
    }

    setFilteredItems(filtered);
  };

  const handleRequestItem = (item) => {
    if (item.contactInfo.phone) {
      const message = `Hi ${item.providerName}, I would like to request the following item:\n\nTitle: ${item.title}\nDescription: ${item.description}\n\nPlease let me know when I can pick it up. Thank you!`;
      const whatsappUrl = `https://wa.me/${item.contactInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      const subject = `Request for ${item.title}`;
      const body = `Hi ${item.providerName},\n\nI would like to request the following item:\n\nTitle: ${item.title}\nDescription: ${item.description}\n\nPlease let me know when I can pick it up.\n\nThank you!`;
      window.open(`mailto:${item.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };

  const clearFilters = () => {
    setFilters({ category: 'all', distance: 'all', search: '', city: 'all' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available items...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to Firebase and fetching donations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for items..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-12 pr-16 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white shadow-sm"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 mb-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white min-w-[140px]"
            >
              <option value="all">All Categories</option>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="products">Products</option>
            </select>

            <select
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white min-w-[140px]"
            >
              <option value="all">All Cities</option>
              {tamilNaduCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {userLocation && (
              <select
                value={filters.distance}
                onChange={(e) => setFilters(prev => ({ ...prev, distance: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white min-w-[140px]"
              >
                <option value="all">All Distances</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
              </select>
            )}

            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {locationPermission === 'denied' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-orange-600 mr-3" />
            <div>
              <p className="text-orange-800 font-medium">Location access denied</p>
              <p className="text-orange-600 text-sm">Enable location to see distance-based filtering and sorting.</p>
              <button
                onClick={requestLocationPermission}
                className="text-green-600 underline hover:text-green-700 text-sm font-medium mt-1"
              >
                Enable location access
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} Available
        </h2>
        {userLocation && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
            Sorted by distance
          </span>
        )}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No items found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Try adjusting your search criteria or check back later for new items.</p>
          <button
            onClick={clearFilters}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              userLocation={userLocation}
              onRequestItem={handleRequestItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsGrid;