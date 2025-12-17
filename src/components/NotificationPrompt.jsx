import React from 'react';

const NotificationPrompt = ({ onEnable, onDisable }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2">Enable Notifications?</h2>
        <p className="mb-4 text-gray-600">
          Would you like to receive notifications when new donations are available near you?
        </p>
        <div className="flex gap-4 justify-end">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onDisable}
          >
            No, thanks
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            onClick={onEnable}
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt; 