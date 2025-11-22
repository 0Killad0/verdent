import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cartItems, updateQty, removeFromCart, getCartTotal, getCartItemsCount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FIXED: Use cartPrice that was calculated when adding to cart
  const getCurrentPrice = (item) => {
    return item.cartPrice || item.price;
  };

  // FIXED: Check if item has valid offer
  const hasValidOffer = (item) => {
    if (!item.offer?.active) return false;
    
    if (item.offer.validUntil) {
      return new Date(item.offer.validUntil) > new Date();
    }
    
    return true;
  };

  // FIXED: Get original price for display
  const getOriginalPrice = (item) => {
    return item.originalPrice || item.price;
  };

  // FIXED: Calculate savings per item
  const getSavingsAmount = (item) => {
    if (!hasValidOffer(item)) return 0;
    
    const original = getOriginalPrice(item);
    const current = getCurrentPrice(item);
    return Math.max(0, original - current);
  };

  // FIXED: Calculate discount percentage
  const getDiscountPercentage = (item) => {
    if (!hasValidOffer(item)) return 0;
    
    const original = getOriginalPrice(item);
    const current = getCurrentPrice(item);
    
    if (original <= 0 || current >= original) return 0;
    
    const percentage = ((original - current) / original) * 100;
    return Math.round(percentage);
  };

  // FIXED: Calculate total savings
  const getTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      const itemSavings = getSavingsAmount(item) * item.qty;
      return total + itemSavings;
    }, 0);
  };

  // FIXED: Calculate subtotals
  const getOriginalSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = getOriginalPrice(item);
      return total + (originalPrice * item.qty);
    }, 0);
  };

  const getCurrentSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item);
      return total + (currentPrice * item.qty);
    }, 0);
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty < 1) {
      toast.error('Quantity cannot be less than 1');
      return;
    }

    const item = cartItems.find(item => item.product === productId);
    if (item && newQty > item.countInStock) {
      toast.error(`Only ${item.countInStock} items available in stock`);
      return;
    }

    updateQty(productId, newQty);
    toast.success('Cart updated');
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success('Item removed from cart');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed to checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Check stock before checkout
    const outOfStockItems = cartItems.filter(item => item.qty > item.countInStock);
    if (outOfStockItems.length > 0) {
      toast.error('Some items in your cart are out of stock. Please update quantities.');
      return;
    }

    navigate('/checkout');
  };

  // Calculate totals
  const originalSubtotal = getOriginalSubtotal();
  const currentSubtotal = getCurrentSubtotal();
  const totalSavings = getTotalSavings();
  const shipping = currentSubtotal > 50 ? 0 : 10;
  const tax = currentSubtotal * 0.08;
  const total = currentSubtotal + shipping + tax;

  const getOverallDiscountPercentage = () => {
    if (originalSubtotal <= 0 || totalSavings <= 0) return 0;
    return Math.round((totalSavings / originalSubtotal) * 100);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Discover our curated collection of sustainable products and find something you'll love.
            </p>
            <Link 
              to="/products" 
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Start Shopping
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{getCartItemsCount()} items in your cart</p>
          </div>
          <div className="flex items-center space-x-4">
            {totalSavings > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-700 text-sm font-semibold">
                  🎉 You're saving {getOverallDiscountPercentage()}% overall!
                </p>
              </div>
            )}
            <div className="flex items-center space-x-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <span className="text-sm font-medium">{getCartItemsCount()} items</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Savings Banner */}
            {totalSavings > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-lg">You're saving ₹{totalSavings.toFixed(2)}!</p>
                      <p className="text-green-100 text-sm">Great deals on selected items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹{totalSavings.toFixed(2)}</p>
                    <p className="text-green-100 text-sm">Total Savings</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {cartItems.map((item) => {
                const hasOffer = hasValidOffer(item);
                const currentPrice = getCurrentPrice(item);
                const originalPrice = getOriginalPrice(item);
                const itemSavings = getSavingsAmount(item) * item.qty;
                const discountPercentage = getDiscountPercentage(item);
                const perItemSavings = getSavingsAmount(item);

                return (
                  <div key={item.product} className="border-b border-gray-100 last:border-b-0">
                    <div className="p-6 flex items-center space-x-6">
                      {/* Product Image */}
                      <Link to={`/product/${item.product}`} className="flex-shrink-0 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/100/100';
                            e.target.onerror = null;
                          }}
                        />
                        {/* Offer Badge */}
                        {hasOffer && discountPercentage > 0 && (
                          <div className="absolute -top-2 -right-2">
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                              {discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Price Display */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            {hasOffer && currentPrice < originalPrice ? (
                              <>
                                <span className="text-green-600 text-xl font-bold">₹{currentPrice.toFixed(2)}</span>
                                <span className="text-gray-500 text-sm line-through">₹{originalPrice.toFixed(2)}</span>
                                {perItemSavings > 0 && (
                                  <span className="text-red-600 text-sm font-semibold bg-red-50 px-2 py-1 rounded">
                                    Save ₹{perItemSavings.toFixed(2)} each
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-green-600 text-xl font-bold">₹{currentPrice.toFixed(2)}</span>
                            )}
                          </div>
                          
                          {hasOffer && item.offer?.offerName && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {item.offer.offerName}
                              </span>
                              {item.offer.validUntil && (
                                <span className="text-xs text-gray-500">
                                  Valid until {new Date(item.offer.validUntil).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-sm ${item.countInStock > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                            {item.countInStock > 10 ? 'In Stock' : `${item.countInStock} left`}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateQty(item.product, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                          </svg>
                        </button>
                        <span className="w-12 text-center font-medium text-gray-900">{item.qty}</span>
                        <button
                          onClick={() => handleUpdateQty(item.product, item.qty + 1)}
                          disabled={item.qty >= item.countInStock}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                          </svg>
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right">
                        <div className="space-y-1">
                          {hasOffer && currentPrice < originalPrice ? (
                            <>
                              <p className="text-lg font-semibold text-gray-900">
                                ₹{(currentPrice * item.qty).toFixed(2)}
                              </p>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-500 line-through">
                                  ₹{(originalPrice * item.qty).toFixed(2)}
                                </p>
                                <p className="text-sm text-red-600 font-semibold">
                                  Save ₹{itemSavings.toFixed(2)}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">
                              ₹{(currentPrice * item.qty).toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.product)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm mt-2 transition-colors group"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Actions */}
            <div className="flex justify-between items-center mt-6">
              <Link
                to="/products"
                className="inline-flex items-center text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                {/* Original Subtotal */}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>Original Price</span>
                    <span className="line-through">₹{originalSubtotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({getCartItemsCount()} items)</span>
                  <span className="font-medium">₹{currentSubtotal.toFixed(2)}</span>
                </div>

                {/* Savings Display */}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div>
                      <span className="font-semibold">Total Savings</span>
                      {getOverallDiscountPercentage() > 0 && (
                        <span className="text-xs ml-2 bg-green-100 text-green-700 px-2 py-1 rounded">
                          {getOverallDiscountPercentage()}% OFF
                        </span>
                      )}
                    </div>
                    <span className="font-bold">-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600 font-semibold">
                        You saved ₹{totalSavings.toFixed(2)} on this order! 🎉
                      </p>
                      <p className="text-xs text-gray-500">
                        That's {getOverallDiscountPercentage()}% off the original price
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Shipping Progress */}
              {currentSubtotal < 50 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm text-green-700 font-semibold">
                      Free shipping on orders over ₹50
                    </p>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((currentSubtotal / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-700 mt-2 text-center">
                    Add <span className="font-semibold">₹{(50 - currentSubtotal).toFixed(2)}</span> more for free shipping
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                <span>Proceed to Checkout</span>
              </button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-2 text-center">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    <span>Secure checkout</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>30-day returns</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Free shipping on orders over ₹50
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;