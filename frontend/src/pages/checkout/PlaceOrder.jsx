import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const PlaceOrder = () => {
  const { cartItems, getCartTotal, getCartItemsCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:5000";

  const { selectedAddress, shippingMethod, shippingCost, paymentMethod } = location.state || {};

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
  const tax = currentSubtotal * 0.08;
  const calculatedShippingCost = shippingCost !== undefined ? shippingCost : (currentSubtotal > 50 ? 0 : 10);
  const total = currentSubtotal + calculatedShippingCost + tax;

  const handleBack = () => {
    navigate('/checkout/payment', {
      state: { selectedAddress, shippingMethod, shippingCost }
    });
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!selectedAddress) {
      toast.error('Shipping address is missing. Please go back.');
      return;
    }
    if (!paymentMethod) {
      toast.error('Payment method is missing. Please go back.');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          productId: item.product, 
          name: item.name,
          image: item.image,
          price: getCurrentPrice(item), // FIXED: Use current price (with offer if applicable)
          originalPrice: item.originalPrice || item.price, // FIXED: Include original price
          qty: item.qty,
          hasOffer: hasValidOffer(item) // FIXED: Include offer status
        })),
        shippingAddress: { 
            name: selectedAddress.name,
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            zipCode: selectedAddress.zipCode,
            country: selectedAddress.country
        },
        paymentMethod,
        itemsPrice: currentSubtotal, // FIXED: Use current subtotal with offers
        taxPrice: tax,
        shippingPrice: calculatedShippingCost,
        totalPrice: total,
        totalSavings: totalSavings // FIXED: Include total savings
      };

      const { data: order } = await axios.post(`${API_BASE_URL}/api/orders`, orderData);

      clearCart();

      // Navigate to success page
      navigate(`/order/success/${order._id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      let errorMessage = 'Failed to place order. Please try again later.';

      if (error.response) {
        if ((error.response.status === 404 || error.response.status === 400) && error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.message) {
           errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = "Could not connect to API. Please check server."
        }
      }

      toast.error(errorMessage); 
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAddress) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Checkout Information Missing</h2>
        <p className="text-gray-500 mb-8">Please complete all checkout steps first.</p>
        <button onClick={() => navigate('/checkout')} className="btn-primary">
          Back to Checkout
        </button>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) { 
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Cart is Empty</h2>
        <p className="text-gray-500 mb-8">Your cart is empty. Please add items to proceed.</p>
        <Link to="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Progress Steps */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-green-600 font-semibold">Cart</div>
          </div>
          <div className="w-16 h-1 bg-green-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-green-600 font-semibold">Shipping</div>
          </div>
          <div className="w-16 h-1 bg-green-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-green-600 font-semibold">Payment</div>
          </div>
          <div className="w-16 h-1 bg-green-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">4</div>
            <div className="ml-2 text-green-600 font-semibold">Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Review */}
        <div className="lg:col-span-2">
          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Shipping Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Shipping Address</h4>
                <div className="text-gray-600">
                  <p className="font-medium">{selectedAddress.name}</p>
                  <p>{selectedAddress.street}</p>
                  <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                  <p>{selectedAddress.country}</p>
                  {selectedAddress.phone && <p>📞 {selectedAddress.phone}</p>}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Shipping Method</h4>
                <p className="text-gray-600 capitalize">
                  {shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)'}
                </p>
                <p className="text-green-600 font-semibold">
                  {calculatedShippingCost === 0 ? 'FREE' : `₹${calculatedShippingCost.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Payment Method</h3>
            <div className="text-gray-600">
              <p className="capitalize font-medium">
                {paymentMethod === 'paypal' ? 'PayPal' : 
                 paymentMethod === 'stripe' ? 'Credit/Debit Card (Stripe)' : 
                 paymentMethod}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {paymentMethod === 'stripe' ? 'Payment will be processed securely via Stripe' : 
                 paymentMethod === 'paypal' ? 'You will be redirected to PayPal upon placing order' :
                 'Secure payment processing'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Order Items ({getCartItemsCount()})</h3>
            <div className="space-y-4">
              {cartItems.map((item) => {
                const currentPrice = getCurrentPrice(item);
                const hasOffer = hasValidOffer(item);
                const originalPrice = item.originalPrice || item.price;
                const itemSavings = (originalPrice - currentPrice) * item.qty;

                return (
                  <div key={item.product} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <img
                      src={item.image || '/api/placeholder/100/100'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { 
                        e.target.src = '/api/placeholder/100/100';
                        e.target.onerror = null;
                      }}
                    />
                    <div className="flex-1">
                      <Link 
                        to={`/product/${item.product}`}
                        className="text-lg font-semibold text-green-900 hover:text-green-700 transition-colors"
                      >
                        {item.name}
                      </Link>
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
                      <p className="text-lg font-semibold text-green-700">
                        ₹{(currentPrice * item.qty).toFixed(2)}
                      </p>
                      {hasOffer && currentPrice < originalPrice && (
                        <p className="text-sm text-red-600">
                          Save ₹{itemSavings.toFixed(2)}
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
                <span>
                  {calculatedShippingCost === 0 ? 'FREE' : `₹${calculatedShippingCost.toFixed(2)}`}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
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
                    You saved ₹{totalSavings.toFixed(2)} on this order! 🎉
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-4 flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>

            <button
              onClick={handleBack}
              disabled={loading}
              className="w-full border border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold text-center block transition-colors shadow-sm hover:shadow-md"
            >
              Back to Payment
            </button>

            {/* Trust Section */}
            <div className="mt-6 space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">By placing your order, you agree to:</h4>
                <ul className="text-xs text-green-600 space-y-1 list-disc list-inside">
                  <li>Our Terms of Service</li>
                  <li>Privacy Policy</li>
                  <li>Return Policy (30 days)</li>
                </ul>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
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
    </div>
  );
};

export default PlaceOrder;