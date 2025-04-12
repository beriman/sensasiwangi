import React from 'react';
import Head from 'next/head';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = React.useState('notifications');

  return (
    <>
      <Head>
        <title>Sensasiwangi - Notifications</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>

        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'preferences'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-500">Loading notifications...</p>
        </div>
      </div>
    </>
  );
}
