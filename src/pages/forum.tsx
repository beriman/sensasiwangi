import React from 'react';
import Head from 'next/head';

export default function ForumPage() {
  return (
    <>
      <Head>
        <title>Sensasiwangi - Forum</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Forum Komunitas</h1>
        <p className="text-gray-600 mb-6">
          Diskusi dan berbagi pengalaman dengan sesama penggemar wewangian.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-500">Loading forum content...</p>
        </div>
      </div>
    </>
  );
}
