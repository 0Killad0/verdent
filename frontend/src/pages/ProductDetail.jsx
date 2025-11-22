import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  // --- Helper Functions for Data Transformation ---

  const getImageUrl = (image) => {
    if (!image) return '/api/placeholder/600/600';
    
    if (typeof image === 'string') {
      return `/api/images/${image}`;
    }
    
    if (image.url) {
      return image.url;
    }
    
    if (image._id) {
      return `/api/images/${image._id}`;
    }
    
    return '/api/placeholder/600/600';
  };

  const getImageUrls = () => {
    if (!product || !product.images || product.images.length === 0) {
      return ['/api/placeholder/600/600'];
    }
    
    return product.images.map(image => getImageUrl(image));
  };

  const hasValidOffer = (product) => {
    if (!product.offer?.active) return false;
    
    if (product.offer.validUntil) {
      return new Date(product.offer.validUntil) > new Date();
    }
    
    return true;
  };

  const getCurrentPrice = (product) => {
    return hasValidOffer(product) && product.offer.offerPrice 
      ? product.offer.offerPrice 
      : product.price;
  };

  const getOriginalPrice = (product) => {
    return product.originalPrice || product.price;
  };

  const getSavingsAmount = (product) => {
    if (!hasValidOffer(product)) return 0;
    return getOriginalPrice(product) - getCurrentPrice(product);
  };

  const getDiscountPercentage = (product) => {
    if (!hasValidOffer(product)) return 0;
    if (product.offer.discountPercentage) return product.offer.discountPercentage;
    
    const originalPrice = getOriginalPrice(product);
    const currentPrice = getCurrentPrice(product);
    if (originalPrice > currentPrice && originalPrice > 0) {
        return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  // -----------------------------------------------------------------
  // --- Data Fetching Effect (FIXED) ---
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchRelatedProducts = async (category, currentProductId) => {
      setRelatedLoading(true);
      try {
        // *********************************************************
        // ** FIX APPLIED HERE: Using query parameters (?category=...) **
        // *********************************************************
        const encodedCategory = encodeURIComponent(category);
        const response = await axios.get(`/api/products?category=${encodedCategory}&limit=5`);

        const filteredProducts = response.data.products.filter(
          product => product._id !== currentProductId
        );
        setRelatedProducts(filteredProducts.slice(0, 4));
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setRelatedLoading(false);
      }
    };

    const fetchProductData = async () => {
      setLoading(true);
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axios.get(`/api/products/${id}`),
          axios.get(`/api/products/${id}/reviews`)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        
        if (productRes.data.category) {
          // Trigger related products fetch only after main product data is available
          fetchRelatedProducts(productRes.data.category, productRes.data._id);
        } else {
            setRelatedProducts([]); // Clear related products if category is missing
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    // Re-fetch everything whenever the product ID changes
  }, [id]);
// -----------------------------------------------------------------

  // --- Handlers ---
  const handleAddToCart = () => {
    if (!product) return;
    
    if (quantity > product.stock) {
      toast.error('Not enough stock available');
      return;
    }
    
    try {
      const cartItem = {
        ...product,
        cartPrice: getCurrentPrice(product)
      };
      
      addToCart(cartItem, quantity);
      toast.success('Added to Cart!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to cart page
    window.location.href = '/cart';
  };


  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      await axios.post(`/api/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted successfully!');
      
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`/api/products/${id}`),
        axios.get(`/api/products/${id}/reviews`)
      ]);
      
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  // --- Conditional Renders ---

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="container mx-auto px-4 py-6 bg-white">
          <div className="animate-pulse">
            <div className="flex flex-wrap gap-8">
              <div className="w-full lg:w-2/5">
                <div className="bg-gray-200 h-96 rounded"></div>
              </div>
              <div className="w-full lg:w-3/5 space-y-4">
                <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-6 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container bg-white min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-medium text-gray-600 mb-4">Product Not Found</h2>
          <Link to="/products" className="green-cart-btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // --- Derived Product Details ---
  const imageUrls = getImageUrls();
  const hasOffer = hasValidOffer(product);
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const savingsAmount = getSavingsAmount(product);
  const discountPercentage = getDiscountPercentage(product);

  // --- Main Component Structure ---
  return (
    <div className="product-detail-container bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex text-sm text-gray-600">
            <Link to="/" className="hover:text-green-600">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-green-600">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap -mx-4">
          {/* Left Column - Images */}
          <div className="w-full lg:w-2/5 px-4 mb-6">
            <div className="sticky top-4">
              {/* Main Image */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center justify-center">
                <img
                  src={imageUrls[activeImage]}
                  alt={product.name}
                  className="max-h-96 object-contain"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/400/400';
                  }}
                />
              </div>
              
              {/* Image Thumbnails */}
              {imageUrls.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {imageUrls.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`flex-shrink-0 border-2 rounded-lg p-1 ${
                        activeImage === index ? 'border-green-600' : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="w-16 h-16 object-contain rounded"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/80/80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Middle/Right Columns - Product Details & Action Box */}
          <div className="w-full lg:w-3/5 px-4">
            <div className="flex flex-wrap -mx-4">
              {/* Product Info (Top Right) */}
              <div className="w-full lg:w-3/5 px-4 mb-6">
                <div className="pr-4">
                  <h1 className="text-2xl font-medium text-gray-900 mb-2 leading-tight">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded text-sm">
                      <span className="mr-1">{(product.ratings || 0).toFixed(1)}</span>
                      <span className="text-xs">★</span>
                    </div>
                    <span className="text-green-600 text-sm font-medium">
                      {product.numOfReviews || 0} Ratings & Reviews
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-3xl font-medium text-gray-900">
                        ₹{currentPrice}
                      </span>
                      {hasOffer && (
                        <span className="text-lg text-gray-500 line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                    
                    {hasOffer && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-green-600 font-medium">
                          {discountPercentage}% off
                        </span>
                        <span className="text-xs text-gray-500">
                          Save ₹{savingsAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {hasOffer && product.offer.offerName && (
                      <div className="text-sm text-green-600 font-medium mb-2">
                        {product.offer.offerName}
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Highlights</h3>
                      <ul className="space-y-1">
                        {product.features.slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <span className="text-green-600 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Service Details */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">Free Delivery</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">7 Days Replacement Policy</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">1 Year Warranty</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Box (Bottom Right) */}
              <div className="w-full lg:w-2/5 px-4">
                <div className="border border-gray-300 rounded-lg p-4 sticky top-4">
                  {/* Delivery Info placeholder */}
                  <div className="mb-4">
                    <div className="flex items-start space-x-2 mb-2">
                      <div>
                        {/* Placeholder for delivery info/pin code */}
                      </div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Seller</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium text-sm">Verdent</span>
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Quantity */}
                  {product.stock > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Quantity</div>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      >
                        {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="mb-4">
                    <div className={`text-sm font-medium ${
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className="green-cart-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ADD TO CART
                    </button>
                    
                    <button
                      onClick={handleBuyNow}
                      disabled={product.stock === 0}
                      className="green-cart-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Description & Details */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Description</h3>
                 <p className="text-gray-700 leading-relaxed whitespace-pre-line">
  {product?.description}
</p>
                </div>

                {/* Specifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Category</span>
                      <span className="text-gray-900 font-medium capitalize">{product.category}</span>
                    </div>
                    {product.ecosystem && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-600">Ecosystem</span>
                        <span className="text-gray-900 font-medium capitalize">{product.ecosystem}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Brand</span>
                      <span className="text-gray-900 font-medium">Verdent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap -mx-4">
            {/* Review Form */}
            <div className="w-full lg:w-1/3 px-4 mb-6">
              <div className="border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Rate this product</h3>
                
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2 font-medium">Rating</label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm(prev => ({
                          ...prev,
                          rating: parseInt(e.target.value)
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} Star{rating !== 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2 font-medium">Review</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({
                          ...prev,
                          comment: e.target.value
                        }))}
                        rows="4"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>
                    
                    <button type="submit" className="green-cart-btn-primary w-full">
                      SUBMIT REVIEW
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Please login to write a review</p>
                    <Link to="/login" className="green-cart-btn-primary">
                      LOGIN
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="w-full lg:w-2/3 px-4">
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Customer Reviews ({reviews.length})
              </h3>
              
              {reviews.length === 0 ? (
                <div className="text-center py-8 border border-gray-300 rounded-lg">
                  <div className="text-4xl mb-4 text-gray-400">💬</div>
                  <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{review.user?.name || 'Anonymous'}</h4>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Similar Products</h2>
          
          {relatedLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Loading Skeleton for Related Products */}
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-4 animate-pulse border border-gray-200">
                  <div className="bg-gray-200 h-40 rounded mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => {
                const hasRelatedOffer = hasValidOffer(relatedProduct);
                const relatedCurrentPrice = getCurrentPrice(relatedProduct);
                const relatedOriginalPrice = getOriginalPrice(relatedProduct);
                
                return (
                  <div key={relatedProduct._id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <Link 
                        to={`/products/${relatedProduct._id}`} 
                        onClick={() => window.scrollTo(0, 0)} // Ensures smooth navigation
                        className="block"
                    >
                      <div className="relative mb-3">
                        <img
                          src={getImageUrl(relatedProduct.images?.[0])}
                          alt={relatedProduct.name}
                          className="w-full h-40 object-contain"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/200/200';
                          }}
                        />
                        {hasRelatedOffer && (
                          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            {getDiscountPercentage(relatedProduct)}% OFF
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 h-10">
                        {relatedProduct.name}
                      </h3>
                      
                      <div className="space-y-1">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg font-medium text-gray-900">
                            ₹{relatedCurrentPrice}
                          </span>
                          {hasRelatedOffer && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{relatedOriginalPrice}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center bg-green-600 text-white px-1 rounded text-xs">
                            <span className="mr-1">{(relatedProduct.ratings || 0).toFixed(1)}</span>
                            <span>★</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No similar products found in the same category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;