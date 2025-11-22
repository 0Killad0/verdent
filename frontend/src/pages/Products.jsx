import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const offer = searchParams.get('offer') || 'all';
  const page = parseInt(searchParams.get('page')) || 1;

  const categories = [
    'all', 'Electronics', 'Cup', 'Home & Kitchen', 
    'Nature Books', 'Artisan Crafts', 'Sustainable Living', 'Wilderness Tools'
  ];

  const offerFilters = [
    { value: 'all', label: 'All Products' },
    { value: 'active', label: 'Special Offers' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== 'all') params.append('category', category);
        if (sort) params.append('sort', sort);
        if (search) params.append('search', search);
        if (offer !== 'all') params.append('offer', offer);
        params.append('page', page);

        const { data } = await axios.get(`/api/products?${params}`);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, sort, search, offer, page]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-serif mb-4">
            {offer === 'active' ? 'Special Offers' : 'Forest Collection'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {offer === 'active' 
              ? 'Discover amazing deals and discounts' 
              : 'Discover curated products inspired by nature\'s beauty'}
          </p>
        </div>

        {/* Top Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Offer Filter */}
              <select
                value={offer}
                onChange={(e) => handleFilterChange('offer', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 text-sm min-w-[160px]"
              >
                {offerFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 text-sm min-w-[160px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Sort Options */}
              <select
                value={sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 text-sm min-w-[160px]"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </div>

          {/* Active Filters & Results Count - REMOVED BORDER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
            {/* Active Filters */}
            <div className="flex flex-wrap gap-2">
              {(category !== 'all' || search || offer !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-800 font-medium px-3 py-1 hover:bg-green-50 rounded-md transition-colors"
                >
                  Clear all filters
                </button>
              )}
              
              {offer !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                  Special Offers
                  <button 
                    onClick={() => handleFilterChange('offer', 'all')}
                    className="ml-1 hover:text-red-600 text-sm"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {category !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  {category}
                  <button 
                    onClick={() => handleFilterChange('category', 'all')}
                    className="ml-1 hover:text-green-600 text-sm"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  Search: "{search}"
                  <button 
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:text-blue-600 text-sm"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-4 animate-pulse shadow-sm border border-gray-200">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3 mb-4"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.products?.map((product) => {
                  const hasOffer = hasValidOffer(product);
                  const currentPrice = getCurrentPrice(product);
                  const originalPrice = getOriginalPrice(product);
                  const savingsAmount = getSavingsAmount(product);
                  
                  return (
                    <div 
                      key={product._id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300 relative"
                    >
                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            {product.offer.discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      <Link to={`/product/${product._id}`}>
                        <div className="relative overflow-hidden bg-gray-50">
                          <img
                            src={product.images && product.images.length > 0 
                              ? `/api/images/${product.images[0]._id || product.images[0]}`
                              : '/api/placeholder/400/400'
                            }
                            alt={product.name}
                            className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Out of Stock
                              </span>
                            </div>
                          )}
                          
                          {product.stock > 0 && product.stock <= 10 && (
                            <div className="absolute top-3 left-3">
                              <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Low Stock
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <div className="p-4">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 hover:text-green-700 transition-colors line-clamp-2 text-sm leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-gray-700">
                                ₹{currentPrice.toLocaleString('en-IN')}
                              </span>
                              {hasOffer && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            {hasOffer && (
                              <span className="text-xs text-green-600 font-semibold">
                                Save ₹{savingsAmount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              <span className="text-gray-600 ml-1 text-sm font-medium">
                                {product.ratings?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm ml-1">
                              ({product.numOfReviews || 0})
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className={`text-xs font-medium ${
                            product.stock > 10 ? 'text-green-600' : 
                            product.stock > 0 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {product.stock > 10 ? 'In Stock' : 
                            product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {products.totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    
                    {[...Array(Math.min(5, products.totalPages))].map((_, index) => {
                      const pageNum = page <= 3 ? index + 1 : 
                                    page >= products.totalPages - 2 ? products.totalPages - 4 + index :
                                    page - 2 + index;
                      
                      if (pageNum > 0 && pageNum <= products.totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleFilterChange('page', pageNum)}
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors min-w-[40px] ${
                              page === pageNum
                                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handleFilterChange('page', Math.min(products.totalPages, page + 1))}
                      disabled={page === products.totalPages}
                      className="px-4 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center"
                    >
                      Next
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && (!products.products || products.products.length === 0) && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-gray-400 mb-4">
                <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No products found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your filters or search terms to discover more products
              </p>
              <button
                onClick={clearFilters}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
              >
                View All Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;