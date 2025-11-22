import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const { cartItems, getCartTotal, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(
    user?.addresses?.find(addr => addr.isDefault) || null
  );

  // FIXED: Use cartPrice for offer prices
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

  // FIXED: Calculate totals using current prices (with offers)
  const getCurrentSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item);
      return total + (currentPrice * item.qty);
    }, 0);
  };

  // FIXED: Calculate total savings
  const getTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      if (!hasValidOffer(item)) return total;
      const original = item.originalPrice || item.price;
      const current = getCurrentPrice(item);
      return total + ((original - current) * item.qty);
    }, 0);
  };

  const currentSubtotal = getCurrentSubtotal();
  const totalSavings = getTotalSavings();
  const shipping = currentSubtotal > 50 ? 0 : 10;
  const tax = currentSubtotal * 0.08;
  const total = currentSubtotal + shipping + tax;

  const handleContinueToShipping = () => {
    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }
    navigate('/checkout/shipping', { state: { selectedAddress } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div className="ml-2 text-green-600 font-semibold">Address</div>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div className="ml-2 text-gray-600">Shipping</div>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div className="ml-2 text-gray-600">Payment</div>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              4
            </div>
            <div className="ml-2 text-gray-600">Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Details */}
        <div className="lg:col-span-2">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Shipping Address</h3>
            
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAddress?._id === address._id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setSelectedAddress(address)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900">{address.name}</h4>
                        <p className="text-gray-600">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                        <p className="text-gray-600 mt-1">{address.phone}</p>
                      </div>
                      {address.isDefault && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <Link
                  to="/user/addresses"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors mt-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add New Address
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">🏠</div>
                <p className="text-gray-600 mb-4">No addresses saved yet.</p>
                <Link
                  to="/user/addresses"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Shipping Address
                </Link>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Order Items ({getCartItemsCount()})</h3>
            <div className="space-y-4">
              {cartItems.map((item) => {
                const currentPrice = getCurrentPrice(item);
                const hasOffer = hasValidOffer(item);
                const originalPrice = item.originalPrice || item.price;

                return (
                  <div key={item.product} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/100/100';
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">{item.name}</h4>
                      <p className="text-gray-600 text-sm">Qty: {item.qty}</p>
                      
                      {/* Price Display */}
                      <div className="mt-1">
                        {hasOffer && currentPrice < originalPrice ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-semibold">₹{currentPrice.toFixed(2)}</span>
                            <span className="text-gray-500 text-sm line-through">₹{originalPrice.toFixed(2)}</span>
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                              Offer
                            </span>
                          </div>
                        ) : (
                          <span className="text-green-600 font-semibold">₹{currentPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">
                        ₹{(currentPrice * item.qty).toFixed(2)}
                      </p>
                      {hasOffer && currentPrice < originalPrice && (
                        <p className="text-sm text-red-600">
                          Save ₹{((originalPrice - currentPrice) * item.qty).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              {/* Subtotal */}
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({getCartItemsCount()} items)</span>
                <span>₹{currentSubtotal.toFixed(2)}</span>
              </div>

              {/* Savings Display */}
              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded border border-green-200">
                  <span className="font-semibold">Total Savings</span>
                  <span className="font-bold">-₹{totalSavings.toFixed(2)}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-green-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    You saved ₹{totalSavings.toFixed(2)}!
                  </p>
                )}
              </div>
            </div>

            {/* Free Shipping Progress */}
            {currentSubtotal < 50 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
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

            <button
              onClick={handleContinueToShipping}
              disabled={!selectedAddress}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-4 shadow-md hover:shadow-lg"
            >
              Continue to Shipping
            </button>

            <Link
              to="/cart"
              className="w-full border border-green-600 text-green-600 hover:bg-green-50 py-3 px-4 rounded-lg font-semibold text-center block transition-colors shadow-sm hover:shadow-md"
            >
              Back to Cart
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Secure SSL encryption</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>30-day money back guarantee</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Free returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;