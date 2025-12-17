import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import NotificationPrompt from './components/NotificationPrompt';

const AuthenticatedApp = () => {
  const { currentUser, loading } = useAuth();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    console.log('AuthenticatedApp: currentUser changed', { currentUser: currentUser?.uid, loading });
    
    if (currentUser && !currentUser.isGuest) {
      const pref = localStorage.getItem('notificationsEnabled');
      if (pref === null) {
        setShowNotificationPrompt(true);
      }
    }
  }, [currentUser?.uid, currentUser?.isGuest]);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notificationsEnabled', 'true');
      } else {
        localStorage.setItem('notificationsEnabled', 'false');
      }
      setShowNotificationPrompt(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowNotificationPrompt(false);
    }
  };

  const handleDisableNotifications = () => {
    localStorage.setItem('notificationsEnabled', 'false');
    setShowNotificationPrompt(false);
  };

  // Show error if there's one
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mealink...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we connect to Firebase</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('AuthenticatedApp: No current user, showing auth flow');
    return <AuthFlow />;
  }

  console.log('AuthenticatedApp: Rendering main app with user', currentUser.uid);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Dashboard />
      {showNotificationPrompt && (
        <NotificationPrompt
          onEnable={handleEnableNotifications}
          onDisable={handleDisableNotifications}
        />
      )}
    </div>
  );
};

const AuthFlow = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      {isLogin ? (
        <Login onToggleMode={() => setIsLogin(false)} />
      ) : (
        <Signup onToggleMode={() => setIsLogin(true)} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;