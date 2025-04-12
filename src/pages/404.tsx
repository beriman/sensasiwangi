import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Sensasiwangi - Page Not Found</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-lg text-center max-w-2xl mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return to Home
        </Link>
      </div>
    </>
  );
}
