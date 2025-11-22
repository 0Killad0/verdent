import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State to track scroll
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Set to true if scrolled more than 10px, false otherwise
      setIsScrolled(window.scrollY > 10);
    };

    // Add event listener on mount
    window.addEventListener('scroll', handleScroll);
    
    // Check scroll position on initial load
    handleScroll(); 

    // Clean up event listener on unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
    setIsAccountOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Dynamic class names for the nav
  // It's transparent at the top (isScrolled = false)
  // It gains the blurred background, shadow, and border when scrolled (isScrolled = true)
  const navClassName = `
    sticky top-0 z-50 transition-all duration-300 ease-in-out
    ${isScrolled 
      ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' 
      : 'bg-transparent border-b border-transparent'
    }
  `;

  return (
    <nav className={navClassName}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
  <Link to="/" className="flex-shrink-0 flex items-end group"> {/* Changed to items-end */}
    <img 
      src={logo} 
      alt="Verdant Logo" 
      className="h-12 w-auto transform translate-y-[-1px] translate-x-[15px]" // Fine-tune positioning
    />
    <span className="text-3xl font-light font-serif text-gray-900 group-hover:text-green-700 transition-colors leading-none">
      erdant
    </span>
  </Link>
</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                isActiveRoute('/') 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`px-3 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                isActiveRoute('/products') 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
              }`}
            >
              Products
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/cart" 
                  className="relative p-2 rounded-md hover:bg-gray-50 transition-all duration-200 group flex items-center space-x-1"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="text-gray-700 font-medium text-sm">Cart</span>
                  {getCartItemsCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-gray-700 font-medium text-sm flex items-center">
                      {user?.name?.split(' ')[0] || 'Account'}
                      <svg 
                        className={`w-3 h-3 ml-1 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  
                  {isAccountOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-gray-700 z-50">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                      
                      <Link 
                        to="/user/dashboard" 
                        className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Dashboard
                      </Link>
                      <Link 
                        to="/user/orders" 
                        className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                        </svg>
                        Orders
                      </Link>
                      <Link 
                        to="/user/profile" 
                        className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        Profile
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <Link 
                          to="/admin/dashboard" 
                          className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors border-t border-gray-100 text-sm"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          Admin Panel
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-t border-gray-100 text-gray-600 text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/cart" 
                  className="relative p-2 rounded-md hover:bg-gray-50 transition-all duration-200 group flex items-center space-x-1"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="text-gray-700 font-medium text-sm">Cart</span>
                  {getCartItemsCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
                
                <Link 
                  to="/login" 
                  className="px-3 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-medium text-sm hover:bg-green-700 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`block w-4 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
                <span className={`block w-4 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`block w-4 h-0.5 bg-gray-700 transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {/* This mobile menu will inherit the background from the main nav.
        When scrolled, it will get the blurred white.
        When at top, it will be transparent. We should give it a solid background
        so it's readable when open at the top.
      */}
      {isOpen && (
        <div className={`md:hidden ${isScrolled ? 'bg-transparent' : 'bg-white'} border-t border-gray-200 shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Cart {getCartItemsCount() > 0 && `(${getCartItemsCount()})`}
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <Link 
                  to="/user/dashboard" 
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/user/orders" 
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Orders
                </Link>
                <Link 
                  to="/user/profile" 
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <Link 
                  to="/login" 
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center px-3 py-2 bg-green-600 text-white font-medium transition-all duration-200 text-sm mx-2 mt-1 justify-center rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
