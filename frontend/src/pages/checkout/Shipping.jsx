import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Shipping = () => {
  const { getCartTotal, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [shippingMethod, setShippingMethod] = useState('standard');
  
  const selectedAddress = location.state?.selectedAddress || 
    user?.addresses?.find(addr => addr.isDefault);

  const subtotal = getCartTotal();
  const shippingCost = shippingMethod === 'express' ? 15 : 
                      subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handleContinueToPayment = () => {
    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }
    navigate('/checkout/payment', { 
      state: { 
        selectedAddress,
        shippingMethod,
        shippingCost
      } 
    });
  };

  const handleBack = () => {
    navigate('/checkout');
  };

  if (!selectedAddress) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">No Shipping Address Selected</h2>
        <p className="text-gray-500 mb-8">Please select a shipping address to continue.</p>
        <button onClick={handleBack} className="btn-primary">
          Back to Address Selection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div className="ml-2 text-forest-600 font-semibold">Cart</div>
          </div>
          
          <div className="w-16 h-1 bg-forest-600 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div className="ml-2 text-forest-600 font-semibold">Shipping</div>
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
        {/* Shipping Details */}
        <div className="lg:col-span-2">
          {/* Selected Address */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Shipping Address</h3>
            <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
              <h4 className="font-semibold text-forest-800">{selectedAddress.name}</h4>
              <p className="text-gray-600">
                {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
              </p>
              <p className="text-gray-600">{selectedAddress.country}</p>
            </div>
            <button
              onClick={handleBack}
              className="text-forest-600 hover:text-forest-700 font-semibold mt-4 transition-colors"
            >
              Change Address
            </button>
          </div>

          {/* Shipping Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Shipping Method</h3>
            <div className="space-y-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  shippingMethod === 'standard' ? 'border-forest-500 bg-forest-50' : 'border-gray-200'
                }`}
                onClick={() => setShippingMethod('standard')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-forest-800">Standard Shipping</h4>
                    <p className="text-gray-600">5-7 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-wood-600">
                      {subtotal > 50 ? 'FREE' : '₹10.00'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  shippingMethod === 'express' ? 'border-forest-500 bg-forest-50' : 'border-gray-200'
                }`}
                onClick={() => setShippingMethod('express')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-forest-800">Express Shipping</h4>
                    <p className="text-gray-600">2-3 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-wood-600">₹15.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({getCartItemsCount()})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-forest-800">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinueToPayment}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-4"
            >
              Continue to Payment
            </button>

            <button
              onClick={handleBack}
              className="w-full border border-forest-600 text-forest-600 hover:bg-forest-50 py-3 px-4 rounded-lg font-semibold text-center block transition-colors"
            >
              Back to Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;