import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Package, Users, UserCircle, AlertTriangle } from 'lucide-react';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Profile from './Profile';
import RequestEssentialsForm from './RequestEssentialsForm';

const Navigation = () => {
  const { currentUser, isGuest, userRole, setUserRole, logout, exitGuestMode } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleRoleToggle = (role) => {
    setUserRole(role);
  };

  const handleProfileClick = () => {
    if (isGuest) {
      setShowAuth(true);
    } else {
      setShowProfile(true);
    }
  };

  const handleLoginClick = () => {
    // If guest, exit guest mode and show main login page
    if (isGuest) {
      exitGuestMode();
    } else {
      setAuthMode('login');
      setShowAuth(true);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Brand */}
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Mealink
              </span>
            </div>

            {/* Center - Role Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => handleRoleToggle('receiver')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  userRole === 'receiver'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Receiver</span>
                <span className="sm:hidden">Receive</span>
              </button>
              <button
                onClick={() => handleRoleToggle('provider')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  userRole === 'provider'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Provider</span>
                <span className="sm:hidden">Provide</span>
              </button>
            </div>

            {/* Right Side - Auth & Profile */}
            <div className="flex items-center space-x-3">
              {/* Request Essentials Button */}
              {!isGuest && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
                  title="Request Essentials for Disaster Situations"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Request Essentials</span>
                  <span className="sm:hidden">Request</span>
                </button>
              )}

              {isGuest && (
                <>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium border border-gray-200">
                    Guest
                  </span>
                  <button
                    onClick={handleLoginClick}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Login
                  </button>
                </>
              )}
              {/* Only show Profile button if not guest */}
              {!isGuest && (
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <UserCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-32 sm:max-w-none truncate">
                    {currentUser?.displayName || currentUser?.email || 'Profile'}
                  </span>
                </button>
              )}

              {!isGuest && (
                <button
                  onClick={logout}
                  className="flex items-center text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <Profile />
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </h2>
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              {authMode === 'login' ? (
                <Login onToggleMode={() => setAuthMode('signup')} />
              ) : (
                <Signup onToggleMode={() => setAuthMode('login')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Essentials Modal */}
      {showRequestForm && (
        <RequestEssentialsForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={(request) => {
            console.log('Request created successfully:', request);
            setShowRequestForm(false);
            // Dispatch custom event to refresh requests list
            window.dispatchEvent(new CustomEvent('requestCreated', { detail: request }));
          }}
        />
      )}
    </>
  );
};

export default Navigation;