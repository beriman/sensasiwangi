import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Apple-style navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 mr-2 text-purple-600"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
              </svg>
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">
                Sensasiwangi
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-7 text-sm font-light">
            <Link to="/" className="hover:text-gray-500">
              Features
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Documentation
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Components
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Examples
            </Link>
            <Link to="/" className="hover:text-gray-500">
              Support
            </Link>
          </nav>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center pt-12">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Sensasiwangi
            </h2>
            <p className="text-xl font-medium text-gray-500 mt-2">
              Community Platform for Perfumers
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
