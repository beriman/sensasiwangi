import React from 'react';
import Head from 'next/head';

export default function HealthCheck() {
  return (
    <>
      <Head>
        <title>Sensasiwangi - Health Check</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">Health Check</h1>
        <p className="text-lg text-center max-w-2xl mb-8">
          The application is running correctly.
        </p>
        <div className="bg-green-100 p-4 rounded-lg border border-green-300">
          <p className="text-green-700">Status: OK</p>
          <p className="text-green-700">Environment: {process.env.NODE_ENV}</p>
          <p className="text-green-700">Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </>
  );
}
