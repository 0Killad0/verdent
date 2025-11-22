import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

// Animation Variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleLoading, setSaleLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data } = await axios.get('/api/products?limit=8&sort=rating');
        setFeaturedProducts(data?.products || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast.error('Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSaleProducts = async () => {
      try {
        // Fetch all products and filter those with active offers
        const { data } = await axios.get('/api/products?limit=20');
        const productsWithOffers = data?.products?.filter(product => 
          hasValidOffer(product)
        ).slice(0, 4) || []; // Take first 4 products with offers
        
        setSaleProducts(productsWithOffers);
      } catch (error) {
        console.error('Error fetching sale products:', error);
        toast.error('Failed to load special offers.');
        setSaleProducts([]);
      } finally {
        setSaleLoading(false);
      }
    };

    fetchFeaturedProducts();
    fetchSaleProducts();
  }, []);

  // Helper function to check if product has valid offer
  const hasValidOffer = (product) => {
    if (!product.offer?.active) return false;
    
    if (product.offer.validUntil) {
      return new Date(product.offer.validUntil) > new Date();
    }
    
    return true;
  };

  // Get current price (offer price if valid, else regular price)
  const getCurrentPrice = (product) => {
    return hasValidOffer(product) && product.offer.offerPrice 
      ? product.offer.offerPrice 
      : product.price;
  };

  // Get original price for display
  const getOriginalPrice = (product) => {
    return product.originalPrice || product.price;
  };

  // Calculate savings amount
  const getSavingsAmount = (product) => {
    if (!hasValidOffer(product)) return 0;
    return getOriginalPrice(product) - getCurrentPrice(product);
  };

  // Get discount percentage
  const getDiscountPercentage = (product) => {
    if (!hasValidOffer(product)) return 0;
    
    // If discount percentage is provided, use it
    if (product.offer.discountPercentage) {
      return product.offer.discountPercentage;
    }
    
    // Calculate discount percentage if not provided
    const originalPrice = getOriginalPrice(product);
    const currentPrice = getCurrentPrice(product);
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (!image) return '/api/placeholder/400/400';
    
    if (typeof image === 'string') {
      return `/api/images/${image}`;
    }
    
    if (image.url) {
      return image.url;
    }
    
    if (image._id) {
      return `/api/images/${image._id}`;
    }
    
    return '/api/placeholder/400/400';
  };

  const handleSubscribe = () => {
    if (!/\S+@\S+\.\S/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Subscribed successfully! Check your inbox for forest news.');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-blue-50">
      {/* ======================= HERO SECTION ======================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Overlay for darker effect and futuristic glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-blue-900/30 to-purple-900/20"></div>

          {/* Background image */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://static.vecteezy.com/system/resources/previews/049/686/494/large_2x/green-leaves-creating-a-natural-frame-on-a-green-background-perfect-for-sustainable-or-eco-friendly-themed-designs-free-photo.jpeg)',
            }}
          ></div>
        </div>

        {/* Hero content */}
        <motion.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          {/* Tagline - Responsive */}
          <div className="inline-flex items-center space-x-4 mb-4 sm:mb-6 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 sm:px-6 sm:py-3">
            <span className="text-sm sm:text-lg font-light">
              Sustainable Eco Marketplace
            </span>
          </div>

          {/* Main title with logo and text - Responsive */}
          <div className="flex items-center justify-center mb-8 sm:mb-12">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src={logo} 
                alt="Verdant Logo" 
                className="h-16 sm:h-20 md:h-24 lg:h-32 xl:h-40 w-auto" 
              />
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold font-serif text-gray-300 leading-tight transform translate-y-[15px] translate-x-[-30px] sm:translate-y-[18px] sm:translate-x-[-34px] md:translate-y-[23px] md:translate-x-[-40px] lg:translate-y-[30px] lg:translate-x-[-70px]">
                erdant
              </span>
            </div>
          </div>

          {/* Subtitle/Description - Responsive */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-8 sm:mb-12 text-green-100 font-light max-w-3xl mx-auto leading-relaxed px-4">
            Designed for speed and sustainability, delivering a better experience for you and the planet.
          </p>

          {/* Call-to-action buttons - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center px-4">
            <Link
              to="/products"
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm sm:text-base md:text-lg lg:text-xl px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 rounded-full shadow-2xl transform hover:scale-105 sm:hover:scale-110 transition-all duration-300 font-semibold text-center"
            >
              Explore Ecosystems
            </Link>
            <Link
              to="/products?offer=active"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-green-900 text-sm sm:text-base md:text-lg lg:text-xl px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 rounded-full transition-all duration-300 font-semibold text-center"
            >
              Special Offers
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ======================= SPECIAL OFFERS SECTION ======================= */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading - Responsive */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 font-serif">
              Special Offers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Exclusive discounts on our premium forest-inspired collections
            </p>
          </div>

          {/* Sale Products Grid - Responsive */}
          {saleLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-4 sm:p-6 animate-pulse shadow-sm border border-gray-100 h-full flex flex-col">
                  <div className="bg-gray-200 h-48 sm:h-56 md:h-64 rounded-lg mb-4 sm:mb-6"></div>
                  <div className="bg-gray-200 h-3 sm:h-4 rounded mb-2 sm:mb-3"></div>
                  <div className="bg-gray-200 h-3 sm:h-4 rounded w-3/4 mb-3 sm:mb-4"></div>
                  <div className="bg-gray-200 h-4 sm:h-6 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : saleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {saleProducts.map((product) => {
                const hasOffer = hasValidOffer(product);
                const currentPrice = getCurrentPrice(product);
                const originalPrice = getOriginalPrice(product);
                const savingsAmount = getSavingsAmount(product);
                const discountPercentage = getDiscountPercentage(product);

                return (
                  <div key={product._id} className="flex">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden group w-full">
                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      <Link to={`/product/${product._id}`} className="block relative overflow-hidden bg-gray-50">
                        <img
                          loading="lazy"
                          src={getImageUrl(product.images?.[0])}
                          alt={product.name}
                          className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      
                      <div className="p-4 sm:p-6 flex flex-col flex-grow">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                        
                        {/* Price Display */}
                        <div className="space-y-1 sm:space-y-2 mt-auto">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-xl sm:text-2xl font-bold text-gray-900">
                              ₹{currentPrice.toLocaleString('en-IN')}
                            </span>
                            {hasOffer && (
                              <span className="text-base sm:text-lg text-gray-500 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          
                          {hasOffer && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-medium text-green-600">
                                Save ₹{savingsAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/product/${product._id}`}
                          className="inline-flex items-center justify-center w-full mt-3 sm:mt-4 bg-gray-100 text-gray-700 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors duration-300 group/btn text-sm sm:text-base"
                        >
                          <span>View Details</span>
                          <span className="ml-2 transform group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // No offers available message
            <div className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md mx-auto shadow-sm border border-gray-100">
                <div className="text-4xl sm:text-6xl mb-4">🌿</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  No Special Offers Available
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Check back later for exciting discounts and promotions!
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-300 text-sm sm:text-base"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          )}

          {/* View All Offers Button - Only show if there are offers */}
          {saleProducts.length > 0 && (
            <div className="text-center mt-8 sm:mt-12">
              <Link
                to="/products?offer=active"
                className="inline-flex items-center bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 shadow-sm hover:shadow-md group text-sm sm:text-base"
              >
                <span>View All Special Offers</span>
                <span className="ml-2 sm:ml-3 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ======================= FEATURED PRODUCTS SECTION ======================= */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading - Responsive */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 font-serif">
              Featured Collections
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Curated selection of our most beloved forest-inspired products
            </p>
          </div>

          {/* Products Grid or Loading Skeletons - Responsive */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-3 sm:p-4 animate-pulse shadow-sm border border-gray-100"
                >
                  <div className="bg-gray-200 h-40 sm:h-48 rounded-lg mb-3 sm:mb-4"></div>
                  <div className="bg-gray-200 h-3 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => {
                const hasOffer = hasValidOffer(product);
                const currentPrice = getCurrentPrice(product);
                const originalPrice = getOriginalPrice(product);
                const discountPercentage = getDiscountPercentage(product);

                return (
                  <div key={product._id}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative group">
                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                          <span className="bg-red-500 text-white px-1 sm:px-2 py-1 rounded text-xs font-medium shadow-sm">
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      <Link
                        to={`/product/${product._id}`}
                        className="block relative overflow-hidden bg-gray-50"
                      >
                        <img
                          loading="lazy"
                          src={getImageUrl(product.images?.[0])}
                          alt={product.name}
                          className="w-full h-40 sm:h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <div className="p-3 sm:p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 hover:text-green-600 transition-colors duration-300 line-clamp-2 text-xs sm:text-sm">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-xs mb-2 sm:mb-3 line-clamp-2 flex-grow leading-relaxed">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span className="text-base sm:text-lg font-semibold text-gray-900">
                                ₹{currentPrice}
                              </span>
                              {hasOffer && (
                                <span className="text-xs sm:text-sm text-gray-500 line-through">
                                  ₹{originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/product/${product._id}`}
                          className="w-full mt-2 sm:mt-3 text-center bg-gray-100 text-gray-700 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors duration-300"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* "View All Products" button - Responsive */}
          <div className="text-center mt-12 sm:mt-16">
            <Link
              to="/products"
              className="inline-flex items-center bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 shadow-sm hover:shadow-md group text-sm sm:text-base"
            >
              <span>View All Products</span>
              <span className="ml-2 sm:ml-3 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= NEWSLETTER SIGN-UP SECTION ======================= */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {/* Section Heading - Responsive */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 font-serif">
            Stay Connected
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8">
            Join our newsletter for eco-friendly updates, deals, and new forest collections.
          </p>

          {/* Email input and subscribe button - Responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSubscribe}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;