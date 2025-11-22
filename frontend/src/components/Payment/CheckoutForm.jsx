import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const CheckoutForm = ({ total, orderInfo }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // 1. Confirm Payment on client-side (Stripe step)
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order/success/`, 
        // Billing/Shipping details should be passed here for Stripe compliance/checks
        shipping: {
          name: orderInfo.selectedAddress.name,
          address: {
            line1: orderInfo.selectedAddress.street,
            city: orderInfo.selectedAddress.city,
            state: orderInfo.selectedAddress.state,
            postal_code: orderInfo.selectedAddress.zipCode,
            // Stripe uses 2-letter country codes - assumes US/CA/GB based on previous code
            country: orderInfo.selectedAddress.country.substring(0, 2).toUpperCase(), 
        },
      },
    },
    });

    if (stripeError) {
      setMessage(stripeError.message);
      setIsLoading(false);
      toast.error(stripeError.message);
      return;
    }

    // 2. If payment succeeded, create and mark the order as paid in your DB
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        const itemsPrice = orderInfo.total - orderInfo.shippingCost - (orderInfo.total * 0.08); // Re-calculate or pass correctly
        
        const orderData = {
          orderItems: cartItems.map(item => ({
            productId: item.product,
            name: item.name,
            image: item.image,
            price: item.price,
            qty: item.qty
          })),
          shippingAddress: orderInfo.selectedAddress,
          paymentMethod: 'stripe',
          itemsPrice: itemsPrice, 
          taxPrice: orderInfo.total * 0.08,
          shippingPrice: orderInfo.shippingCost,
          totalPrice: orderInfo.total
        };

        // Create Order in your database (This endpoint decrements stock)
        const { data: createdOrder } = await axios.post('/api/orders', orderData);

        // Mark Order to Paid Status (This is a separate step to cleanly save payment data)
        await axios.put(`/api/orders/${createdOrder._id}/pay`, {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString(),
          email_address: orderInfo.selectedAddress.email || '' 
        });

        // 3. Clear Cart and Navigate
        clearCart();
        toast.success('Payment successful! Order placed.');
        navigate(`/order/success/${createdOrder._id}`);

      } catch (dbError) {
        setMessage("Payment succeeded, but failed to save order in DB. Contact support.");
        toast.error('Order saving failed. Contact support.');
        console.error('DB Save Error:', dbError);
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />

      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>

      {message && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm" id="payment-message">
          {message}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-forest-100 rounded-lg">
        <h4 className="text-sm font-medium text-forest-800 mb-2">Use Test Card:</h4>
        <p className="text-xs text-forest-600">
          Card Number: <strong>4242 4242 4242 4242</strong>
        </p>
        <p className="text-xs text-forest-600">
          Expiry: Any future date (e.g., 12/34) | CVC: Any 3 digits
        </p>
      </div>
    </form>
  );
}

export default CheckoutForm;