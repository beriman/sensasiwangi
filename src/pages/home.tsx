import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Sensasiwangi - Home</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Sensasiwangi</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Marketplace</h2>
            <p className="text-gray-600 mb-4">
              Discover unique products from local sellers and artisans.
            </p>
            <a
              href="/marketplace"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Explore Marketplace →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Forum</h2>
            <p className="text-gray-600 mb-4">
              Join discussions, share knowledge, and connect with the community.
            </p>
            <a
              href="/forum"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit Forum →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Sambatan</h2>
            <p className="text-gray-600 mb-4">
              Participate in community projects and help each other.
            </p>
            <a
              href="/marketplace/sambatan"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Join Sambatan →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
