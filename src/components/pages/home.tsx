import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  Settings,
  User,
  MessageSquare,
  ShoppingBag,
  Award,
  Sparkles,
  Users,
  Droplet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function LandingPage() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl flex items-center">
              <Droplet className="h-6 w-6 mr-2 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">
                Scentrium
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-7 text-sm font-light">
            <Link to="/forum" className="hover:text-gray-500">
              Forum
            </Link>
            <Link to="/marketplace" className="hover:text-gray-500">
              Marketplace
            </Link>
            <Link to="/kelas" className="hover:text-gray-500">
              Kelas
            </Link>
            <Link to="/bisnis" className="hover:text-gray-500">
              Bisnis
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium hover:text-purple-600"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 text-sm px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero section */}
        <section className="py-24 text-center bg-gradient-to-b from-white to-purple-50">
          <div className="max-w-[1200px] mx-auto px-4">
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
              Community Platform
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Scentrium
            </h2>
            <h3 className="text-2xl font-medium text-gray-600 mb-6 max-w-3xl mx-auto">
              The ultimate community platform for perfume enthusiasts and
              creators
            </h3>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-xl">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 px-8"
                >
                  Join the Community
                </Button>
              </Link>
              <Link to="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  Explore Features
                </Button>
              </Link>
            </div>
            <div className="mt-16 relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute top-20 right-20 w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2"></div>
                  <img
                    src="https://images.unsplash.com/photo-1615213612138-4d1195b1c0e7?w=1200&q=80"
                    alt="Perfume community"
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-white text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-2">
              Discover the Scentrium Experience
            </h2>
            <h3 className="text-xl font-medium text-gray-600 mb-12 max-w-3xl mx-auto">
              A complete ecosystem for perfume enthusiasts with gamified
              interactions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Community Forum</h4>
                <p className="text-gray-600">
                  Engage in discussions with fellow perfume enthusiasts and
                  share your knowledge.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-pink-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">
                  Gamified Experience
                </h4>
                <p className="text-gray-600">
                  Earn XP and badges through your contributions and engagement
                  with the community.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Marketplace</h4>
                <p className="text-gray-600">
                  Buy, sell, and trade perfume ingredients and finished
                  creations securely.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Rich Profiles</h4>
                <p className="text-gray-600">
                  Showcase your perfume journey, achievements, and collections
                  on your profile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Experience section */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
                  Gamified Forum
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Earn Experience & Badges
                </h2>
                <p className="text-gray-600 mb-6">
                  Our unique experience system rewards your contributions:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-600 text-sm font-bold">
                        +1
                      </span>
                    </div>
                    <span className="text-gray-700">
                      Create new discussion threads
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">
                        +5
                      </span>
                    </div>
                    <span className="text-gray-700">
                      Receive likes on your posts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 text-sm font-bold">-3</span>
                    </div>
                    <span className="text-gray-700">
                      Receive dislikes on your posts
                    </span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                      Start Earning Now
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
                  <div className="flex items-center mb-6">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
                        alt="User"
                      />
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xl font-semibold">Alice Perfumer</h4>
                      <div className="flex items-center mt-1">
                        <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                          Level 12
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Master Mixer
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">Experience Points</h5>
                        <span className="text-purple-600 font-bold">
                          1,245 XP
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        755 XP to Level 13
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-center">
                        <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        <div className="text-sm font-medium">12 Badges</div>
                      </div>
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-center">
                        <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-medium">86 Posts</div>
                      </div>
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-center">
                        <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <div className="text-sm font-medium">24 Sales</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace section */}
        <section className="py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2"></div>
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-4">
                      Marketplace Listings
                    </h4>
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex border-b border-gray-100 pb-4"
                        >
                          <div className="h-16 w-16 bg-purple-100 rounded-lg mr-4 overflow-hidden">
                            <img
                              src={`https://images.unsplash.com/photo-1595425964377-155aa60d6e73?w=200&q=80`}
                              alt="Product"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">
                              Jasmine Essential Oil
                            </h5>
                            <p className="text-sm text-gray-500">
                              Pure extract, 15ml bottle
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-purple-600 font-semibold">
                                $24.99
                              </span>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                In Stock
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        className="rounded-full border-purple-300 text-purple-600 hover:bg-purple-50 w-full"
                      >
                        View All Products
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
                  Secure Marketplace
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Buy, Sell & Trade with Confidence
                </h2>
                <p className="text-gray-600 mb-6">
                  Our marketplace connects perfumers with unique ingredients and
                  creations:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">
                      Secure escrow payment system protects both buyers and
                      sellers
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">
                      Verified seller badges ensure quality and authenticity
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">
                      Easy listing creation with detailed product descriptions
                    </span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                      Start Trading
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4">
              Join Our Perfume Community Today
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Connect with fellow enthusiasts, share your creations, and take
              your perfume journey to the next level.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="rounded-full bg-white text-purple-600 hover:bg-gray-100 px-8"
              >
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 text-sm">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
            <div>
              <h4 className="font-bold text-lg mb-4 flex items-center">
                <Droplet className="h-5 w-5 mr-2 text-purple-400" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                  Scentrium
                </span>
              </h4>
              <p className="text-gray-400 mb-4">
                The ultimate community platform for perfume enthusiasts and
                creators.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/forum"
                    className="text-gray-400 hover:text-purple-400"
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Badges & Rewards
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Premium Membership
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Perfume Guides
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Ingredient Database
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Community Rules
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-purple-400">
                    GDPR Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-gray-400">
            <p>© 2024 Scentrium. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
