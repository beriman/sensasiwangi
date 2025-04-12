import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const userIdString = Array.isArray(userId) ? userId[0] : userId || '';

  return (
    <>
      <Head>
        <title>Sensasiwangi - Profile</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Experience</h2>
                <p className="text-center text-gray-500">Loading experience data...</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Badges</h2>
                <p className="text-center text-gray-500">Loading badges...</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Activity</h2>
                <p className="text-center text-gray-500">Loading activity...</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Connections</h2>
                <p className="text-center text-gray-500">Loading connections...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
