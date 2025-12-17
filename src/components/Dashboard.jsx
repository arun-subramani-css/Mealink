import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UploadForm from './provider/UploadForm';
import ItemsGrid from './receiver/ItemsGrid';
import RequestsList from './RequestsList';

const Dashboard = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('main');
  const requestsListRef = useRef(null);

  const tabs = [
    { id: 'main', label: userRole === 'provider' ? 'Upload Items' : 'Browse Items' },
    { id: 'requests', label: ' Disaster Requests' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestsList ref={requestsListRef} />;
      case 'main':
      default:
        return userRole === 'provider' ? <UploadForm /> : <ItemsGrid />;
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // If switching to requests tab, refresh the list
    if (tabId === 'requests' && requestsListRef.current) {
      console.log('Switching to requests tab, refreshing list...');
      setTimeout(() => {
        if (requestsListRef.current?.refreshRequests) {
          requestsListRef.current.refreshRequests();
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;