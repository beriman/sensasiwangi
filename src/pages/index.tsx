import React from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to home page component
    router.push('/home');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sensasiwangi</h1>
        <p className="mt-4">Loading...</p>
      </div>
    </div>
  );
}
