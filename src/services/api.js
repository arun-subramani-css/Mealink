// Dynamic API base URL that works in different environments
const getApiBaseUrl = () => {
  // In development, try to detect the backend server port
  if (process.env.NODE_ENV === 'development') {
    // Try common ports for the backend
    const ports = [8000, 8001, 8002, 8003, 8004, 3001, 5000];
    
    // For now, use the default port, but we'll add port detection later
    return 'http://localhost:8000/api';
  }
  
  // In production, use environment variable or relative URL
  return process.env.REACT_APP_API_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get Firebase UID
const getFirebaseUID = () => {
  // Get from localStorage or from current user context
  return localStorage.getItem('firebaseUID');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const firebaseUID = getFirebaseUID();
  
  console.log('API Request:', {
    endpoint,
    firebaseUID,
    method: options.method || 'GET',
    hasBody: !!options.body,
    baseUrl: API_BASE_URL
  });
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(firebaseUID && { 'X-Firebase-UID': firebaseUID }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('Sending request to:', fullUrl);
    console.log('Headers:', config.headers);
    if (options.body) {
      console.log('Request body:', options.body);
    }
    
    const response = await fetch(fullUrl, config);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.warn('Could not parse error response as JSON:', parseError);
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('API Error Response:', errorData);
      
      // Provide more specific error messages
      if (response.status === 0) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend server is running.');
      } else if (response.status === 404) {
        throw new Error(`API endpoint not found: ${endpoint}. Please check the backend server configuration.`);
      } else if (response.status === 500) {
        const details = errorData.details || errorData.error || 'Unknown server error';
        throw new Error(`Server error: ${details}. Please try again later or contact support.`);
      } else if (response.status === 401) {
        const details = errorData.details || errorData.error || 'Authentication failed';
        throw new Error(`Authentication error: ${details}. Please log in again.`);
      } else if (response.status === 403) {
        const details = errorData.details || errorData.error || 'Access denied';
        throw new Error(`Permission denied: ${details}. You do not have access to this resource.`);
      } else if (response.status === 400) {
        const details = errorData.details || errorData.error || 'Bad request';
        throw new Error(`Request error: ${details}. Please check your input and try again.`);
      } else {
        throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
      }
    }
    
    const responseData = await response.json();
    console.log('API Success Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    
    // Enhance error messages for common network issues
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error(`Network error: Unable to connect to ${API_BASE_URL}. Please check if the backend server is running on the correct port.`);
      }
    }
    
    throw error;
  }
};

// Helper function to ensure user exists in backend database
const ensureUserExists = async (firebaseUID) => {
  try {
    console.log('Ensuring user exists in backend for Firebase UID:', firebaseUID);
    
    // First, try to get the current user
    const response = await fetch(`${API_BASE_URL}/auth/me/${firebaseUID}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('User already exists in backend:', data.user);
      return data.user;
    }
    
    // If user doesn't exist, create them
    console.log('User not found in backend, creating new user...');
    
    // Get current user data from Firebase Auth context
    const currentUser = JSON.parse(localStorage.getItem('firebaseUser') || '{}');
    console.log('Firebase user data from localStorage:', currentUser);
    
    if (!currentUser.email || !currentUser.displayName) {
      throw new Error('Missing required user data. Please log in again to refresh your session.');
    }
    
    const userData = {
      email: currentUser.email,
      displayName: currentUser.displayName || 'User',
      firebaseUid: firebaseUID,
      phone: currentUser.phoneNumber || '',
      address: currentUser.address || '',
      isGoogleUser: currentUser.providerData?.[0]?.providerId === 'google.com'
    };
    
    console.log('Creating user with data:', userData);
    
    const createResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('User creation failed:', errorData);
      throw new Error(`Failed to create user in backend: ${errorData.error || errorData.details || 'Unknown error'}`);
    }
    
    const createData = await createResponse.json();
    console.log('User created in backend successfully:', createData.user);
    return createData.user;
    
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw new Error(`User creation/verification failed: ${error.message}`);
  }
};

// Auth API
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store Firebase UID
    if (userData.firebaseUid) {
      localStorage.setItem('firebaseUID', userData.firebaseUid);
    }
    
    return response;
  },

  // Login user (Firebase handles this, just store UID)
  login: async (firebaseUser) => {
    // Store Firebase UID
    if (firebaseUser.uid) {
      localStorage.setItem('firebaseUID', firebaseUser.uid);
    }
    
    return { user: firebaseUser };
  },

  // Get current user by Firebase UID
  getCurrentUser: async (firebaseUid) => {
    return await apiRequest(`/auth/me/${firebaseUid}`);
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('firebaseUID');
  },
};

// Donations API
export const donationsAPI = {
  // Get all donations
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/donations?${queryString}`);
  },

  // Get donation by ID
  getById: async (id) => {
    return await apiRequest(`/donations/${id}`);
  },

  // Create donation
  create: async (donationData) => {
    const formData = new FormData();
    
    // Add image file
    if (donationData.image) {
      formData.append('image', donationData.image);
    }
    
    // Add other fields
    Object.keys(donationData).forEach(key => {
      if (key !== 'image') {
        formData.append(key, donationData[key]);
      }
    });

    const firebaseUID = getFirebaseUID();
    console.log('Creating donation with Firebase UID:', firebaseUID);
    
    if (!firebaseUID) {
      throw new Error('No Firebase UID found. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/donations`, {
        method: 'POST',
        headers: {
          'X-Firebase-UID': firebaseUID,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
        }
        
        console.error('Donation creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Donation created successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error in donation creation:', error);
      throw error;
    }
  },

  // Update donation
  update: async (id, updateData) => {
    return await apiRequest(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Reserve donation
  reserve: async (id) => {
    return await apiRequest(`/donations/${id}/reserve`, {
      method: 'POST',
    });
  },

  // Mark as donated
  markDonated: async (id) => {
    return await apiRequest(`/donations/${id}/donate`, {
      method: 'POST',
    });
  },

  // Delete donation
  delete: async (id) => {
    return await apiRequest(`/donations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  // Get user's donations
  getDonations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/users/donations?${queryString}`);
  },

  // Get user's reservations
  getReservations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/users/reservations?${queryString}`);
  },

  // Get user statistics
  getStats: async () => {
    return await apiRequest('/users/stats');
  },
};

// Requests API
export const requestsAPI = {
  // Get all active requests
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/requests?${queryString}`);
  },

  // Get requests by category
  getByCategory: async (category) => {
    return await apiRequest(`/requests/category/${category}`);
  },

  // Get urgent requests
  getUrgent: async () => {
    return await apiRequest('/requests/urgent');
  },

  // Get user's own requests
  getMyRequests: async () => {
    return await apiRequest('/requests/my-requests');
  },

  // Get request by ID
  getById: async (id) => {
    return await apiRequest(`/requests/${id}`);
  },

  // Create new request with user creation
  create: async (requestData) => {
    const firebaseUID = getFirebaseUID();
    
    if (!firebaseUID) {
      throw new Error('No Firebase UID found. Please log in again.');
    }
    
    try {
      // Ensure user exists in backend before creating request
      console.log('Ensuring user exists in backend...');
      await ensureUserExists(firebaseUID);
      console.log('User exists in backend, proceeding with request creation...');
      
      // Now create the request
      return await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      
    } catch (error) {
      console.error('Error in request creation:', error);
      throw error;
    }
  },

  // Respond to a request
  respond: async (id, responseData) => {
    return await apiRequest(`/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  },

  // Update request status
  updateStatus: async (id, status) => {
    return await apiRequest(`/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Cancel request
  cancel: async (id) => {
    return await apiRequest(`/requests/${id}`, {
      method: 'DELETE',
    });
  },

  // Get expired count
  getExpiredCount: async () => {
    return await apiRequest('/requests/expired/count');
  },
};

// Health check with port detection
export const healthCheck = async () => {
  // Try to detect which port the backend is running on
  const ports = [8000, 8001, 8002, 8003, 8004, 3001, 5000];
  
  for (const port of ports) {
    try {
      console.log(`Trying to connect to backend on port ${port}...`);
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (response.ok) {
        console.log(`Backend found on port ${port}`);
        // Update the API base URL for future requests
        globalThis.DETECTED_BACKEND_PORT = port;
        return { ok: true, port, message: `Backend server is running on port ${port}` };
      }
    } catch (error) {
      console.log(`Port ${port} not accessible:`, error.message);
      continue;
    }
  }
  
  throw new Error('Backend server not found on any of the expected ports. Please ensure the backend server is running.');
};

// Enhanced health check that also tests the requests endpoint
export const testRequestsEndpoint = async () => {
  try {
    const health = await healthCheck();
    console.log('Testing requests endpoint...');
    
    // Test the requests endpoint specifically
    const response = await fetch(`http://localhost:${health.port}/api/requests`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      return { ok: true, message: 'Requests endpoint is working correctly' };
    } else {
      throw new Error(`Requests endpoint returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Requests endpoint test failed:', error);
    throw error;
  }
};

export default {
  auth: authAPI,
  donations: donationsAPI,
  users: usersAPI,
  health: healthCheck,
}; 