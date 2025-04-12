import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <Head>
        <title>Sensasiwangi - Home</title>
      </Head>

      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/" className="font-medium text-xl flex items-center">
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">
                sensasiwangi.id
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium">
            <Link
              href="/"
              className="hover:text-purple-600 transition-colors text-gray-700"
            >
              Beranda
            </Link>
            <Link
              href="/forum"
              className="hover:text-purple-600 transition-colors text-gray-700"
            >
              Forum
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-purple-600 transition-colors text-gray-700"
            >
              Marketplace
            </Link>
          </nav>
          <div className="flex items-center space-x-2">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-purple-600">
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-16 pt-6 pb-12">
        <div className="max-w-[1200px] px-4 mx-auto">
          <div className="py-8">
            <h1 className="text-3xl font-bold mb-6">Welcome to Sensasiwangi</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Marketplace</h2>
                <p className="text-gray-600 mb-4">
                  Discover unique products from local sellers and artisans.
                </p>
                <Link
                  href="/marketplace"
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Explore Marketplace →
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Forum</h2>
                <p className="text-gray-600 mb-4">
                  Join discussions, share knowledge, and connect with the community.
                </p>
                <Link
                  href="/forum"
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Visit Forum →
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Sambatan</h2>
                <p className="text-gray-600 mb-4">
                  Participate in community projects and help each other.
                </p>
                <Link
                  href="/marketplace/sambatan"
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Join Sambatan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-3">sensasiwangi.id</h3>
              <p className="text-gray-600 text-sm">
                Platform komunitas dan marketplace untuk penggemar wewangian Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Tentang Kami</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Karir
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Bantuan</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Kontak
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Kebijakan Privasi
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Ikuti Kami</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} sensasiwangi.id. Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
