import React, { ReactNode } from "react";
import MainNavbar from "./MainNavbar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  fullWidth?: boolean;
}

function MainLayout({

  children,
  className,
  withPadding = true,
  fullWidth = false,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <MainNavbar />
      <main
        className={cn(
          "flex-1 mt-16",
          withPadding && "pt-6 pb-12",
          className
        )}
      >
        <div
          className={cn(
            "mx-auto",
            fullWidth ? "w-full" : "max-w-[1200px] px-4"
          )}
        >
          {children}
        </div>
      </main>
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
                    Pusat Bantuan
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Syarat dan Ketentuan
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Hubungi Kami</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Email: info@sensasiwangi.id
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    Telepon: +62 123 4567 890
                  </a>
                </li>
                <li className="flex space-x-3 mt-3">
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-purple-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                  </a>
                </li>
              </ul>
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

export { MainLayout };
export default MainLayout;
